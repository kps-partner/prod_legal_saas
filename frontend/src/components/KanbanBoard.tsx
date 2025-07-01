'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CompactCaseCard } from './CompactCaseCard';
import { Calendar, Mail, Phone, Clock, AlertCircle, CheckCircle2, Users, FileText, Archive, ExternalLink } from 'lucide-react';

interface Case {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  description: string;
  status: 'new_lead' | 'meeting_scheduled' | 'pending_review' | 'engaged' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  last_activity: string;
}

interface AIInsight {
  case_id: string;
  summary: string;
  recommendations: string;
  recommendation_type: 'approve' | 'reject' | 'undecided';
  confidence_score: number;
  generated_at: string;
  status: 'processing' | 'completed' | 'failed';
}

interface KanbanBoardProps {
  cases: Case[];
  onStatusChange: (caseId: string, newStatus: Case['status']) => Promise<void>;
  showArchived: boolean;
}

const statusConfig = {
  new_lead: {
    title: 'New Leads',
    icon: Users,
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100 text-blue-800',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  meeting_scheduled: {
    title: 'Meeting Scheduled',
    icon: Calendar,
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-100 text-yellow-800',
    badgeColor: 'bg-yellow-100 text-yellow-800'
  },
  pending_review: {
    title: 'Pending Review',
    icon: Clock,
    color: 'bg-orange-50 border-orange-200',
    headerColor: 'bg-orange-100 text-orange-800',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  engaged: {
    title: 'Engaged',
    icon: FileText,
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-100 text-green-800',
    badgeColor: 'bg-green-100 text-green-800'
  },
  closed: {
    title: 'Closed',
    icon: CheckCircle2,
    color: 'bg-gray-50 border-gray-200',
    headerColor: 'bg-gray-100 text-gray-800',
    badgeColor: 'bg-gray-100 text-gray-800'
  },
  archived: {
    title: 'Archived',
    icon: Archive,
    color: 'bg-slate-50 border-slate-200',
    headerColor: 'bg-slate-100 text-slate-800',
    badgeColor: 'bg-slate-100 text-slate-800'
  }
};

const priorityConfig = {
  low: { color: 'bg-green-100 text-green-800', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  high: { color: 'bg-red-100 text-red-800', label: 'High' }
};

export function KanbanBoard({ cases, onStatusChange, showArchived }: KanbanBoardProps) {
  const router = useRouter();
  const [draggedCase, setDraggedCase] = useState<Case | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Simplified AI insights state management (extracted from working case details page)
  const [aiInsights, setAiInsights] = useState<Record<string, AIInsight | null>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiErrors, setAiErrors] = useState<Record<string, string | null>>({});
  const [token, setToken] = useState<string | null>(null);

  // Get token on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    setToken(accessToken);
  }, []);

  // Fetch AI insights for a specific case (extracted from case details page)
  const fetchAIInsightsForCase = async (caseId: string) => {
    if (!token || !caseId || aiLoading[caseId]) return;

    // Skip if we already have insights and no error
    if (aiInsights[caseId] && !aiErrors[caseId]) return;

    try {
      setAiLoading(prev => ({ ...prev, [caseId]: true }));
      setAiErrors(prev => ({ ...prev, [caseId]: null }));
      
      console.log(`🔍 Fetching AI insights for case ${caseId}...`);
      
      const response = await fetch(`http://localhost:8000/api/v1/ai/insights/${caseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: AIInsight[] = await response.json();
        const insight = data.length > 0 ? data[0] : null;
        setAiInsights(prev => ({ ...prev, [caseId]: insight }));
        console.log(`✅ AI insights fetched for case ${caseId}:`, insight?.recommendation_type || 'none');
      } else if (response.status === 404) {
        // No AI insights found yet
        setAiInsights(prev => ({ ...prev, [caseId]: null }));
        console.log(`ℹ️ No AI insights found for case ${caseId}`);
      } else {
        throw new Error(`Failed to fetch AI insights: ${response.statusText}`);
      }
    } catch (err) {
      console.error(`❌ Error fetching AI insights for case ${caseId}:`, err);
      setAiErrors(prev => ({
        ...prev,
        [caseId]: err instanceof Error ? err.message : 'Failed to fetch AI insights'
      }));
    } finally {
      setAiLoading(prev => ({ ...prev, [caseId]: false }));
    }
  };

  // Fetch AI insights for all cases when token is available
  useEffect(() => {
    if (token && cases.length > 0) {
      console.log(`🚀 Starting AI insights fetch for ${cases.length} cases...`);
      cases.forEach(caseItem => {
        fetchAIInsightsForCase(caseItem.id);
      });
    }
  }, [token, cases]);

  // Helper functions to match the old useAIInsights interface
  const getInsight = (caseId: string) => aiInsights[caseId] || null;
  const isLoading = (caseId: string) => aiLoading[caseId] || false;
  const getError = (caseId: string) => aiErrors[caseId] || null;
  
  // Debug logging for AI insights
  if (process.env.NODE_ENV === 'development') {
    console.log('KanbanBoard AI Debug:', {
      totalCases: cases.length,
      caseIds: cases.slice(0, 3).map(c => c.id), // Show first 3 case IDs
      sampleInsights: cases.slice(0, 3).map(c => ({
        caseId: c.id,
        hasInsight: !!getInsight(c.id),
        isLoading: isLoading(c.id),
        error: getError(c.id),
        insight: getInsight(c.id)
      }))
    });
  }

  // Filter statuses based on showArchived
  const visibleStatuses = showArchived
    ? ['archived'] as const
    : ['new_lead', 'meeting_scheduled', 'pending_review', 'engaged', 'closed'] as const;

  const handleDragStart = (e: React.DragEvent, caseItem: Case) => {
    setDraggedCase(caseItem);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Case['status']) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedCase && draggedCase.status !== newStatus) {
      await onStatusChange(draggedCase.id, newStatus);
    }
    setDraggedCase(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCasesByStatus = (status: Case['status']) => {
    return cases
      .filter(caseItem => caseItem.status === status)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const handleCaseClick = (caseId: string, e: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons or during drag
    if ((e.target as HTMLElement).closest('button') || draggedCase) {
      return;
    }
    router.push(`/cases/${caseId}`);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {visibleStatuses.map((status) => {
        const config = statusConfig[status];
        const statusCases = getCasesByStatus(status);
        const Icon = config.icon;
        const isDragOver = dragOverColumn === status;

        return (
          <div
            key={status}
            className={`flex-shrink-0 w-80 ${config.color} rounded-lg border-2 transition-all duration-200 ${
              isDragOver ? 'border-blue-400 bg-blue-50' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className={`${config.headerColor} px-4 py-3 rounded-t-lg border-b`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <h3 className="font-semibold">{config.title}</h3>
                </div>
                <Badge variant="secondary" className={config.badgeColor}>
                  {statusCases.length}
                </Badge>
              </div>
            </div>

            {/* Cases */}
            <div className="p-4 space-y-2 min-h-[200px]">
              {statusCases.map((caseItem) => (
                <CompactCaseCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  onStatusChange={onStatusChange}
                  onCaseClick={handleCaseClick}
                  onDragStart={handleDragStart}
                  aiInsight={getInsight(caseItem.id)}
                  aiLoading={isLoading(caseItem.id)}
                  aiError={getError(caseItem.id)}
                />
              ))}

              {statusCases.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No cases in {config.title.toLowerCase()}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}