import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 1),
  iterations: Number(__ENV.ITERATIONS || 1),
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Single completion object (mirrors frontend request shape)
const completion = {
  model: __ENV.MODEL || '',
  prompt: __ENV.PROMPT || 'Hello world',
  token: {
    idx: Number(__ENV.TOKEN_IDX || 0),
    id: Number(__ENV.TOKEN_ID || 0),
    text: __ENV.TOKEN_TEXT || '',
    targetIds: (() => {
      try {
        return JSON.parse(__ENV.TARGET_IDS || '[42,43]');
      } catch (_) {
        return [42, 43];
      }
    })(),
  },
};

const POLL_TIMEOUT_MS = Number(__ENV.POLL_TIMEOUT_MS || 15000);
const POLL_INTERVAL_MS = Number(__ENV.POLL_INTERVAL_MS || 1000);

function startJob(path: string, body: unknown): string {
  const res = http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'start: 200 OK': (r) => r.status === 200,
    'start: has job_id': (r) => Boolean(r.json('job_id')),
  });
  const jobId = String(res.json('job_id'));
  return jobId;
}

function pollNdif(jobId: string): void {
  const startedAt = Date.now();
  while (true) {
    const resp = http.get(`https://ndif.dev/response/${jobId}`);
    check(resp, { 'poll: 200 OK': (r) => r.status === 200 });
    const status = String(resp.json('status') || '');

    if (status === 'COMPLETED') return;
    if (status === 'ERROR' || status === 'NNSIGHT_ERROR') {
      throw new Error(`NDIF job failed with status=${status}`);
    }
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      throw new Error('Timed out waiting for NDIF job to complete');
    }
    sleep(POLL_INTERVAL_MS / 1000);
  }
}

function fetchResults(pathBase: string, body: unknown, jobId: string) {
  const res = http.post(`${BASE_URL}${pathBase}/${jobId}`, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'results: 200 OK': (r) => r.status === 200 });
  return res.json();
}

function testLensLine(): void {
  const body = completion;
  const jobId = startJob('/lens/start-line', body);
  pollNdif(jobId);
  const result = fetchResults('/lens/results-line', body, jobId);

  check(result, {
    'line: has lines': (r) => r && typeof r === 'object' && Array.isArray(r.lines),
  });
}

function testLensGrid(): void {
  const body = { model: completion.model, prompt: completion.prompt };
  const jobId = startJob('/lens/start-grid', body);
  pollNdif(jobId);
  const result = fetchResults('/lens/results-grid', body, jobId);

  check(result, {
    'grid: has rows': (r) => r && typeof r === 'object' && Array.isArray(r.rows),
  });
}

export default function lensFlowTest(): void {
  if (!completion.model) {
    throw new Error('MODEL env var is required');
  }

  group('Lens Line', () => {
    testLensLine();
  });

  group('Lens Grid', () => {
    testLensGrid();
  });
}


