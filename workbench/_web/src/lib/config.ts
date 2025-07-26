// Configuration for the application
// In development, you can override these values by creating a .env.local file
// In production, these should be set through your deployment platform's environment variables

const config = {
    // Backend API URL - can be overridden by NEXT_PUBLIC_BACKEND_URL environment variable
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
    
    // API endpoints
    endpoints: {
        getLensLine: '/lens/get-line',
        listenLensLine: '/lens/listen-line',

        getLensGrid: '/lens/get-grid',
        listenLensGrid: '/lens/listen-grid',

        getExecuteSelected: '/models/get-execute-selected',
        listenExecuteSelected: '/models/listen-execute-selected',
        
        getExecutePair: '/models/get-execute-pair',
        listenExecutePair: '/models/listen-execute-pair',

        models: '/models',
        patch: '/patch/patch-grid',
        execute: '/api/execute',
        executeSelected: '/api/execute_selected',
        executePair: '/models/execute_pair',
        processData: '/process-data',
        tokenize: '/tokenize',
    },
    
    // Helper function to get full API URL
    getApiUrl: (endpoint: string) => `${config.backendUrl}${endpoint}`,
} as const;

export default config; 