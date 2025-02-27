export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '/api';

export const getApiUrl = (endpoint: string): string => {
  // Validate input
  if (typeof endpoint !== 'string') {
    throw new Error('Endpoint must be a string');
  }

  // If the endpoint starts with http, assume it's a full URL
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Clean up the endpoint and combine with base URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};