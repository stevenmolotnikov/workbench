// Configuration for the application

const config = {
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
    endpoints: {
        // Lens (polling)
        startLensLine: '/lens/start-line',
        resultsLensLine: (jobId: string) => `/lens/results-line/${jobId}`,

        startLensGrid: '/lens/start-grid',
        resultsLensGrid: (jobId: string) => `/lens/results-grid/${jobId}`,

        startExecuteSelected: '/models/start-execute-selected',
        resultsExecuteSelected: (jobId: string) => `/models/results-execute-selected/${jobId}`,

        startGenerate: '/models/start-generate',
        resultsGenerate: (jobId: string) => `/models/results-generate/${jobId}`,
        
        models: '/models/',
        // encode: '/models/encode',
        // decode: '/models/decode',
    },
    getApiUrl: (endpoint: string) => `${config.backendUrl}${endpoint}`,
    ndifStatusUrl: (jobId: string) => `https://ndif.dev/response/${jobId}`,
} as const;

export default config;