'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Trash2
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

interface AIInsightCardProps {
  insight: AIInsight | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const recommendationConfig = {
  approve: { 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Approve Case'
  },
  reject: { 
    icon: XCircle, 
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Reject Case'
  },
  undecided: { 
    icon: Clock, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Needs Review'
  }
};

export function AIInsightCard({ insight, loading, error, onRefresh }: AIInsightCardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Recently generated';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Recently generated';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating AI Insights...
          </CardTitle>
          <CardDescription className="text-blue-600">
            Analyzing case notes and generating recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse space-y-3 w-full">
              <div className="h-4 bg-blue-200 rounded w-3/4"></div>
              <div className="h-4 bg-blue-200 rounded w-1/2"></div>
              <div className="h-4 bg-blue-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            AI Insights Error
          </CardTitle>
          <CardDescription className="text-red-600">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!insight) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            No AI insights generated yet. Select timeline notes and generate insights to get AI-powered case analysis.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const config = recommendationConfig[insight.recommendation_type] || recommendationConfig.undecided;
  const RecommendationIcon = config?.icon || Clock;

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
            <CardDescription className="text-purple-600">
              Generated {formatDate(insight.generated_at)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Case Summary</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {insight.summary}
          </p>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">AI Recommendations</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {insight.recommendations}
          </p>
        </div>

        {/* Status indicator for processing */}
        {insight.status === 'processing' && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing insights...
          </div>
        )}
      </CardContent>
    </Card>
  );
}