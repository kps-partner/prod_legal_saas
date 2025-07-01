'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIRecommendationBadge } from './AIRecommendationBadge';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Mail,
  Phone,
  ExternalLink,
  Send
} from 'lucide-react';

interface AIInsight {
  case_id: string;
  summary: string;
  recommendations: string;
  recommendation_type: 'approve' | 'reject' | 'undecided';
  confidence_score: number;
  generated_at: string;
  status: 'processing' | 'completed' | 'failed';
}

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

interface CompactCaseCardProps {
  caseItem: Case;
  onStatusChange: (caseId: string, newStatus: Case['status']) => Promise<void>;
  onCaseClick: (caseId: string, e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, caseItem: Case) => void;
  aiInsight?: AIInsight | null;
  aiLoading?: boolean;
  aiError?: string | null;
}

const getNextStatusAction = (currentStatus: Case['status']) => {
  switch (currentStatus) {
    case 'new_lead':
      return { 
        nextStatus: 'meeting_scheduled' as const, 
        label: 'Schedule', 
        icon: Calendar 
      };
    case 'meeting_scheduled':
      return { 
        nextStatus: 'pending_review' as const, 
        label: 'Review', 
        icon: Clock 
      };
    case 'pending_review':
      return { 
        nextStatus: 'engaged' as const, 
        label: 'Engage', 
        icon: FileText 
      };
    case 'engaged':
      return { 
        nextStatus: 'closed' as const, 
        label: 'Close', 
        icon: CheckCircle2 
      };
    case 'closed':
      return { 
        nextStatus: 'archived' as const, 
        label: 'Archive', 
        icon: Users 
      };
    default:
      return null;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export function CompactCaseCard({
  caseItem,
  onStatusChange,
  onCaseClick,
  onDragStart,
  aiInsight,
  aiLoading,
  aiError
}: CompactCaseCardProps) {
  const nextAction = getNextStatusAction(caseItem.status);

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextAction) {
      onStatusChange(caseItem.id, nextAction.nextStatus);
    }
  };

  // Only show AI badge if there's an actual insight (not loading, not error, and has recommendation)
  const shouldShowAIBadge = aiInsight && !aiLoading && !aiError && aiInsight.status === 'completed';
  
  // Debug logging to understand why AI badges aren't showing
  if (process.env.NODE_ENV === 'development') {
    console.log(`Case ${caseItem.id} AI Debug:`, {
      hasAiInsight: !!aiInsight,
      aiLoading,
      aiError,
      aiInsightStatus: aiInsight?.status,
      recommendationType: aiInsight?.recommendation_type,
      shouldShowAIBadge
    });
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className="cursor-pointer hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50"
            draggable
            onDragStart={(e) => onDragStart(e, caseItem)}
            onClick={(e) => onCaseClick(caseItem.id, e)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1 flex-1 pr-2">
                  {caseItem.client_name}
                </h3>
                {nextAction && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-6 px-2 flex-shrink-0"
                    onClick={handleActionClick}
                  >
                    <nextAction.icon className="h-3 w-3 mr-1" />
                    {nextAction.label}
                  </Button>
                )}
              </div>
              
              {/* Submission date and AI badge */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Send className="h-3 w-3" />
                  <span>Submitted {formatDate(caseItem.created_at)}</span>
                </div>
                {shouldShowAIBadge && (
                  <AIRecommendationBadge
                    insight={aiInsight}
                    loading={aiLoading}
                    error={aiError}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        
        {/* Detailed tooltip with case information */}
        <TooltipContent side="right" className="max-w-sm p-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-1">
                {caseItem.client_name}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {caseItem.description}
              </p>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{caseItem.client_email}</span>
              </div>
              
              {caseItem.client_phone && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span>{caseItem.client_phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Send className="h-3 w-3 flex-shrink-0" />
                <span>Submitted {formatDate(caseItem.created_at)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>Last updated {formatDate(caseItem.updated_at)}</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <ExternalLink className="h-3 w-3" />
                <span>Click to view details</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}