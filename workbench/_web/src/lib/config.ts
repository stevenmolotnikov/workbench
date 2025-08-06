// Configuration for the application

const config = {
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
    endpoints: {
        getLensLine: '/lens/get-line',
        listenLensLine: '/lens/listen-line',

        getLensGrid: '/lens/get-grid',
        listenLensGrid: '/lens/listen-grid',

        getExecuteSelected: '/models/get-execute-selected',
        listenExecuteSelected: '/models/listen-execute-selected',
        
        models: '/models/',
        encode: '/models/encode',
        decode: '/models/decode',
    },
    getApiUrl: (endpoint: string) => `${config.backendUrl}${endpoint}`,
} as const;

export default config; 