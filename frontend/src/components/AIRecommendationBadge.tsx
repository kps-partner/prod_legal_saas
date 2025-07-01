'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsight {
  case_id: string;
  summary: string;
  recommendations: string;
  recommendation_type: 'approve' | 'reject' | 'undecided';
  confidence_score: number;
  generated_at: string;
  status: 'processing' | 'completed' | 'failed';
}

interface AIRecommendationBadgeProps {
  insight?: AIInsight | null;
  loading?: boolean;
  error?: string | null;
}

const recommendationConfig = {
  approve: {
    icon: CheckCircle,
    label: 'AI Recommends Approve',
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600'
  },
  reject: {
    icon: XCircle,
    label: 'AI Recommends Reject',
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600'
  },
  undecided: {
    icon: HelpCircle,
    label: 'AI Analysis Undecided',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600'
  }
};

export function AIRecommendationBadge({ insight, loading, error }: AIRecommendationBadgeProps) {
  // Don't render anything if no insight and not loading
  if (!insight && !loading && !error) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        AI Analyzing...
      </Badge>
    );
  }

  // Error state
  if (error) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
            <Brain className="h-3 w-3 mr-1" />
            AI Error
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm p-3">
          <p className="text-sm text-red-600">{error}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // No insight available
  if (!insight) {
    return null;
  }

  const config = recommendationConfig[insight.recommendation_type];
  const RecommendationIcon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn("text-xs cursor-help", config.color)}>
          <Brain className="h-3 w-3 mr-1" />
          <RecommendationIcon className={cn("h-3 w-3", config.iconColor)} />
          <span className="ml-1">{config.label.replace('AI Recommends ', '').replace('AI Analysis ', '')}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">AI Analysis</span>
            <Badge variant="secondary" className="text-xs">
              {Math.round(insight.confidence_score * 100)}% confidence
            </Badge>
          </div>
          
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Summary:</p>
            <p className="text-xs text-gray-600 leading-relaxed">{insight.summary}</p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Recommendation:</p>
            <p className="text-xs text-gray-600 leading-relaxed">{insight.recommendations}</p>
          </div>
          
          <div className="pt-1 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Generated {new Date(insight.generated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}