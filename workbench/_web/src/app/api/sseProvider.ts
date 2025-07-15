import config from '@/lib/config';
import { toast } from 'sonner';

const eventSourcesMap: Record<string, EventSource> = {};

const generateTaskId = (): string => {
  return `sse-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

const createEventSource = (
  url: string,
  onMessage: (data: unknown) => void,
  onFinish: () => void,
): { eventSource: EventSource; onCancel: () => void } => {
  const taskId = generateTaskId();

  const eventSource = new EventSource(`${config.backendUrl}${url}`, {
    withCredentials: true,
  });

  eventSourcesMap[taskId] = eventSource;

  eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
      closeConnection();
      return;
    }

    try {
      const data = JSON.parse(event.data);
      console.log('(sse)', data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing SSE data:', error);
      toast.error('Failed to parse server-sent event data');
    }
  };

  eventSource.onerror = (error) => {
    console.error('EventSource error:', error);
    toast.error('Server-sent event connection failed');
    closeConnection();
  };

  const closeConnection = () => {
    if (eventSourcesMap[taskId]) {
      eventSource.close();
      delete eventSourcesMap[taskId];
    }
    onFinish();
  };

  return {
    eventSource,
    onCancel: closeConnection,
  };
};

const sseService = {
  createEventSource,
  generateTaskId,
};

export default sseService;
