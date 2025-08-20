// Configuration for the application

const config = {
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
    endpoints: {
        // Lens (polling)
        startLensLine: '/lens/start-line',
        resultsLensLine: (jobId: string) => `/lens/results-line/${jobId}`,

        startLensGrid: '/lens/start-grid',
        resultsLensGrid: (jobId: string) => `/lens/results-grid/${jobId}`,

        startPrediction: '/models/start-prediction',
        resultsPrediction: (jobId: string) => `/models/results-prediction/${jobId}`,

        startGenerate: '/models/start-generate',
        resultsGenerate: (jobId: string) => `/models/results-generate/${jobId}`,
        
        models: '/models/',
        // encode: '/models/encode',
        // decode: '/models/decode',
    },
    getApiUrl: (endpoint: string) => `${config.backendUrl}${endpoint}`,
    ndifStatusUrl: (jobId: string) => `https://api.ndif.us/response/${jobId}`,
    // ndifStatusUrl: (jobId: string) => `http://dev-nlb-5bbd7ae7fcd3eea2.elb.us-east-1.amazonaws.com:8001/response/${jobId}`,
} as const;

export default config;