/**
 * Centralized API configuration for the frontend application
 * Uses environment variables to support different deployment environments
 */

// Get the API base URL from environment variables with fallback to localhost for development
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Helper function to construct API endpoints
 * @param path - The API path (e.g., '/api/v1/cases')
 * @returns Complete API URL
 */
export const getApiUrl = (path: string): string => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  // Cases
  CASES: '/api/v1/cases',
  CASES_ARCHIVED: '/api/v1/cases/archived',
  CASE_BY_ID: (id: string) => `/api/v1/cases/${id}`,
  CASE_STATUS: (id: string) => `/api/v1/cases/${id}/status`,
  CASE_TIMELINE: (id: string) => `/api/v1/cases/${id}/timeline`,
  
  // AI Insights
  AI_INSIGHTS: (id: string) => `/api/v1/ai/insights/${id}`,
  AI_INSIGHTS_GENERATE: (caseId: string, notesText: string) => 
    `/api/v1/ai/insights/generate?case_id=${caseId}&notes_text=${encodeURIComponent(notesText)}`,
  AI_INSIGHTS_REFRESH: (id: string) => `/api/v1/ai/insights/${id}/refresh`,
} as const;

// Log configuration for debugging
console.log('🔧 API Configuration:', {
  API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL
});