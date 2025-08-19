import config from "./config";
import { useWorkspace } from "@/stores/useWorkspace";

const POLL_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 1000;

async function awaitNDIFJob(jobId: string): Promise<void> {
    const startedAt = Date.now();
    const { setJobStatus } = useWorkspace.getState();
    while (true) {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
            setJobStatus("timeout");
            throw new Error("Timed out waiting for job to complete");
        }

        const pollResp = await fetch(config.ndifStatusUrl(jobId));
        if (!pollResp.ok) throw new Error("Polling failed");
        const data = await pollResp.json();
        const status = data?.status as string | undefined;

        if (status === "COMPLETED") {
            setJobStatus("idle");
            return;
        }
        if (status === "ERROR" || status === "NNSIGHT_ERROR") {
            setJobStatus("error");
            throw new Error("Job failed");
        }

        if (status) {
            setJobStatus(status);
        }

        // For non-terminal statuses, wait and try again
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
}

async function startJob(url: string, body: unknown): Promise<string> {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Failed to start job");
    const { job_id } = await response.json();
    return job_id;
}

async function fetchResults<T>(
    url: string,
    body: unknown
): Promise<T> {
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error("Failed to fetch results");
    return resp.json() as Promise<T>;
}

export async function startAndPoll<T>(
    startEndpoint: string,
    body: unknown,
    resultsEndpoint: (jobId: string) => string,
): Promise<T> {

    const startUrl = config.getApiUrl(startEndpoint);
    const jobId = await startJob(startUrl, body);
    await awaitNDIFJob(jobId);

    const resultsUrl = config.getApiUrl(resultsEndpoint(jobId));
    return fetchResults(resultsUrl, body);
}