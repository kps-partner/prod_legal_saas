'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiUrl } from '../lib/api-config';

interface AIInsight {
  case_id: string;
  summary: string;
  recommendations: string;
  recommendation_type: 'approve' | 'reject' | 'undecided';
  confidence_score: number;
  generated_at: string;
  status: 'processing' | 'completed' | 'failed';
}

interface AIInsightsState {
  insights: Record<string, AIInsight>;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
}

export function useAIInsights(caseIds: string[]) {
  const [state, setState] = useState<AIInsightsState>({
    insights: {},
    loading: {},
    errors: {}
  });

  // Track which cases we've already fetched to prevent duplicates
  const fetchedCasesRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  const fetchInsightForCase = useCallback(async (caseId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token || !isMountedRef.current) return;

    // Skip if already fetched
    if (fetchedCasesRef.current.has(caseId)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`AI Insights Hook - Skipping already fetched case: ${caseId}`);
      }
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`AI Insights Hook - Starting fetch for case: ${caseId}`);
    }

    // Set loading state
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [caseId]: true },
      errors: { ...prev.errors, [caseId]: '' }
    }));

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`AI Insights Hook - About to fetch for Case ${caseId}`);
      }
      
      const response = await fetch(getApiUrl(`/api/v1/ai/insights/${caseId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!isMountedRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`AI Insights Hook - Component unmounted during fetch for Case ${caseId}`);
        }
        return;
      }

      // Debug logging for response
      if (process.env.NODE_ENV === 'development') {
        console.log(`AI Insights Hook - Response for Case ${caseId}:`, {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });
      }

      if (response.ok) {
        try {
          const data: AIInsight[] = await response.json();
          const latestInsight = data.length > 0 ? data[0] : null;
          
          // Debug logging
          if (process.env.NODE_ENV === 'development') {
            console.log(`AI Insights Hook - Data for Case ${caseId}:`, {
              responseLength: data.length,
              hasLatestInsight: !!latestInsight,
              latestInsight: latestInsight,
              rawData: data
            });
          }
          
          setState(prev => ({
            ...prev,
            insights: latestInsight
              ? { ...prev.insights, [caseId]: latestInsight }
              : prev.insights,
            loading: { ...prev.loading, [caseId]: false }
          }));
          
          // Mark as fetched only after successful processing
          fetchedCasesRef.current.add(caseId);
        } catch (jsonError) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`AI Insights Hook - JSON parsing error for Case ${caseId}:`, jsonError);
          }
          throw new Error(`Failed to parse AI insights response: ${jsonError}`);
        }
      } else if (response.status === 404) {
        // No insights available for this case - not an error
        if (process.env.NODE_ENV === 'development') {
          console.log(`AI Insights Hook - No insights found for Case ${caseId}`);
        }
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, [caseId]: false }
        }));
        
        // Mark as fetched even for 404 to avoid repeated requests
        fetchedCasesRef.current.add(caseId);
      } else {
        throw new Error(`Failed to fetch AI insights: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`AI Insights Hook - Error for Case ${caseId}:`, error);
      }
      
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, [caseId]: false },
        errors: {
          ...prev.errors,
          [caseId]: error instanceof Error ? error.message : 'Failed to fetch AI insights'
        }
      }));
    }
  }, []);

  // Fetch insights when caseIds change
  useEffect(() => {
    if (caseIds.length > 0) {
      // Only fetch for new cases that haven't been fetched yet
      const newCaseIds = caseIds.filter(id => !fetchedCasesRef.current.has(id));
      
      if (newCaseIds.length > 0) {
        // Fetch insights for all new cases in parallel
        newCaseIds.forEach(caseId => {
          fetchInsightForCase(caseId);
        });
      }
    }
  }, [caseIds.join(','), fetchInsightForCase]); // Use join to create stable dependency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Helper functions
  const getInsight = useCallback((caseId: string) => state.insights[caseId] || null, [state.insights]);
  const isLoading = useCallback((caseId: string) => state.loading[caseId] || false, [state.loading]);
  const getError = useCallback((caseId: string) => state.errors[caseId] || null, [state.errors]);

  // Refresh insights for specific cases
  const refreshInsights = useCallback(async (ids: string[]) => {
    // Remove from fetched set to allow refetch
    ids.forEach(id => fetchedCasesRef.current.delete(id));
    
    // Clear existing data for these cases
    setState(prev => {
      const newInsights = { ...prev.insights };
      const newErrors = { ...prev.errors };
      ids.forEach(id => {
        delete newInsights[id];
        delete newErrors[id];
      });
      return {
        ...prev,
        insights: newInsights,
        errors: newErrors
      };
    });

    // Fetch fresh data
    ids.forEach(caseId => {
      fetchInsightForCase(caseId);
    });
  }, [fetchInsightForCase]);

  return {
    getInsight,
    isLoading,
    getError,
    refreshInsights,
    // Overall loading state - true if any case is loading
    isAnyLoading: Object.values(state.loading).some(Boolean),
    // Overall error state - true if any case has an error
    hasAnyError: Object.values(state.errors).some(Boolean)
  };
}