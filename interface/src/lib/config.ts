// Configuration for the application
// In development, you can override these values by creating a .env.local file
// In production, these should be set through your deployment platform's environment variables

const config = {
    // Backend API URL - can be overridden by NEXT_PUBLIC_BACKEND_URL environment variable
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
    
    // API endpoints
    endpoints: {
        lens: '/api/lens',
        models: '/models',
        patch: '/api/patch',
        execute: '/api/execute',
        executeSelected: '/api/execute_selected',
    },
    
    // Helper function to get full API URL
    getApiUrl: (endpoint: string) => `${config.backendUrl}${endpoint}`,
} as const;

export default config; 