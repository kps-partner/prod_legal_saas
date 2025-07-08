'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AIInsightCard } from '@/components/ui/ai-insight-card';
import {
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  User,
  FileText,
  MessageSquare,
  Calendar,
  AlertCircle,
  Send,
  Loader2,
  Brain,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api-config';

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
  case_type_name?: string;
}

interface TimelineEvent {
  id: string;
  case_id: string;
  firm_id: string;
  user_id?: string;
  user_name?: string;
  type: string;
  content: string;
  created_at: string;
}

interface TimelineResponse {
  case_id: string;
  events: TimelineEvent[];
  total: number;
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

const statusConfig = {
  new_lead: { label: 'New Lead', color: 'bg-blue-100 text-blue-800' },
  meeting_scheduled: { label: 'Meeting Scheduled', color: 'bg-yellow-100 text-yellow-800' },
  pending_review: { label: 'Pending Review', color: 'bg-orange-100 text-orange-800' },
  engaged: { label: 'Engaged', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-800' }
};

const priorityConfig = {
  low: { color: 'bg-green-100 text-green-800', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  high: { color: 'bg-red-100 text-red-800', label: 'High' }
};

const eventTypeConfig = {
  note: { icon: MessageSquare, label: 'Note', color: 'bg-blue-50 border-blue-200' },
  status_change: { icon: FileText, label: 'Status Change', color: 'bg-green-50 border-green-200' },
  case_created: { icon: User, label: 'Case Created', color: 'bg-gray-50 border-gray-200' }
};

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const caseId = params.caseId as string;

  const [token, setToken] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // AI Insights state
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsightError, setAiInsightError] = useState<string | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [pollingTimeoutId, setPollingTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    setToken(accessToken);
  }, []);

  const fetchCaseData = async () => {
    if (!token || !caseId) return;

    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/v1/cases/${caseId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Case not found');
        }
        throw new Error(`Failed to fetch case: ${response.statusText}`);
      }

      const data: Case = await response.json();
      setCaseData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching case:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch case');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    if (!token || !caseId) return;

    try {
      setTimelineLoading(true);
      const response = await fetch(getApiUrl(`/api/v1/cases/${caseId}/timeline`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch timeline: ${response.statusText}`);
      }

      const data: TimelineResponse = await response.json();
      setTimeline(data.events);
    } catch (err) {
      console.error('Error fetching timeline:', err);
      // Don't set error for timeline, just log it
    } finally {
      setTimelineLoading(false);
    }
  };

  const submitNote = async () => {
    if (!token || !caseId || !noteContent.trim()) return;

    try {
      setSubmittingNote(true);
      const response = await fetch(getApiUrl(`/api/v1/cases/${caseId}/timeline`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: noteContent.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add note: ${response.statusText}`);
      }

      // Clear the note content and refresh timeline
      setNoteContent('');
      await fetchTimeline();
    } catch (err) {
      console.error('Error adding note:', err);
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  // AI Insights functions
  const fetchAIInsights = async () => {
    if (!token || !caseId || aiInsightLoading) return;

    // Skip if we already have insights and no error
    if (aiInsight && !aiInsightError) return;

    try {
      setAiInsightLoading(true);
      setAiInsightError(null);
      
      const response = await fetch(getApiUrl(`/api/v1/ai/insights/${caseId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: AIInsight[] = await response.json();
        // Take the most recent insight (first in the array)
        setAiInsight(data.length > 0 ? data[0] : null);
      } else if (response.status === 404) {
        // No AI insights found yet
        setAiInsight(null);
      } else {
        throw new Error(`Failed to fetch AI insights: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setAiInsightError(err instanceof Error ? err.message : 'Failed to fetch AI insights');
    } finally {
      setAiInsightLoading(false);
    }
  };

  const generateAIInsights = async () => {
    if (!token || !caseId || selectedNotes.size === 0 || generatingInsight) return;

    try {
      setGeneratingInsight(true);
      setAiInsightError(null);

      // Clear any existing polling
      if (pollingTimeoutId) {
        clearTimeout(pollingTimeoutId);
        setPollingTimeoutId(null);
      }

      // Get selected timeline notes content
      const selectedNotesContent = timeline
        .filter(event => selectedNotes.has(event.id) && event.type === 'note')
        .map(event => event.content)
        .join('\n\n');

      if (!selectedNotesContent.trim()) {
        throw new Error('No note content selected for analysis');
      }

      const response = await fetch(getApiUrl(`/api/v1/ai/insights/generate?case_id=${caseId}&notes_text=${encodeURIComponent(selectedNotesContent)}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate AI insights: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Start polling for completion
      if (data.task_id) {
        pollForInsights();
      } else {
        setGeneratingInsight(false);
      }
    } catch (err) {
      console.error('Error generating AI insights:', err);
      setAiInsightError(err instanceof Error ? err.message : 'Failed to generate AI insights');
      setGeneratingInsight(false);
    }
  };

  const pollForInsights = async () => {
    // Clear any existing polling timeout
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
      setPollingTimeoutId(null);
    }

    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setAiInsightError('AI insights generation timed out. Please try again.');
        setGeneratingInsight(false);
        return;
      }

      try {
        // Fetch insights and get the response directly
        const response = await fetch(getApiUrl(`/api/v1/ai/insights/${caseId}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        attempts++;

        if (response.ok) {
          const data: AIInsight[] = await response.json();
          if (data.length > 0) {
            const latestInsight = data[0];
            setAiInsight(latestInsight);
            setGeneratingInsight(false);
            
            // Stop polling - we have insights
            console.log('✅ AI insights found, stopping polling');
            return;
          }
        } else if (response.status === 404) {
          // No insights yet, continue polling
          console.log(`⏳ No insights yet (attempt ${attempts}/${maxAttempts}), continuing...`);
        } else if (response.status === 401) {
          // Token expired, stop polling and show error
          setAiInsightError('Authentication expired. Please refresh the page and try again.');
          setGeneratingInsight(false);
          return;
        } else {
          throw new Error(`Failed to fetch AI insights: ${response.statusText}`);
        }
        
        // Continue polling if we don't have insights yet
        if (attempts < maxAttempts) {
          const timeoutId = setTimeout(poll, 1000); // Poll every second
          setPollingTimeoutId(timeoutId);
        } else {
          setGeneratingInsight(false);
        }
      } catch (err) {
        console.error('Error polling for insights:', err);
        if (attempts < maxAttempts) {
          const timeoutId = setTimeout(poll, 1000);
          setPollingTimeoutId(timeoutId);
        } else {
          setAiInsightError('Failed to fetch AI insights. Please try again.');
          setGeneratingInsight(false);
        }
      }
    };

    const initialTimeoutId = setTimeout(poll, 2000); // Start polling after 2 seconds
    setPollingTimeoutId(initialTimeoutId);
  };

  const refreshAIInsights = async () => {
    if (!token || !caseId || selectedNotes.size === 0 || generatingInsight) return;

    try {
      setGeneratingInsight(true);
      setAiInsightError(null);

      // Clear any existing polling
      if (pollingTimeoutId) {
        clearTimeout(pollingTimeoutId);
        setPollingTimeoutId(null);
      }

      // Get selected timeline notes content
      const selectedNotesContent = timeline
        .filter(event => selectedNotes.has(event.id) && event.type === 'note')
        .map(event => event.content)
        .join('\n\n');

      if (!selectedNotesContent.trim()) {
        throw new Error('No note content selected for analysis');
      }

      const response = await fetch(getApiUrl(`/api/v1/ai/insights/${caseId}/refresh`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          case_id: caseId,
          notes_text: selectedNotesContent
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh AI insights: ${response.statusText}`);
      }

      // Start polling for the new insights
      pollForInsights();
    } catch (err) {
      console.error('Error refreshing AI insights:', err);
      setAiInsightError(err instanceof Error ? err.message : 'Failed to refresh AI insights');
      setGeneratingInsight(false);
    }
  };

  const deleteAIInsights = async () => {
    if (!token || !caseId) return;

    try {
      const response = await fetch(getApiUrl(`/api/v1/ai/insights/${caseId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete AI insights: ${response.statusText}`);
      }

      setAiInsight(null);
      setSelectedNotes(new Set());
    } catch (err) {
      console.error('Error deleting AI insights:', err);
      setAiInsightError(err instanceof Error ? err.message : 'Failed to delete AI insights');
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    const newSelection = new Set(selectedNotes);
    if (newSelection.has(noteId)) {
      newSelection.delete(noteId);
    } else {
      newSelection.add(noteId);
    }
    setSelectedNotes(newSelection);
  };

  useEffect(() => {
    console.log('🔄 Case details useEffect triggered - this should only run once per caseId/token change');
    if (token && caseId) {
      // Fetch case data first, then timeline and AI insights in parallel
      fetchCaseData().then(() => {
        // Only fetch timeline and AI insights after case data is loaded
        Promise.all([
          fetchTimeline(),
          fetchAIInsights()
        ]);
      });
    }
  }, [token, caseId]); // FIXED: Removed function dependencies that cause infinite loop

  // Cleanup polling timeout on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutId) {
        clearTimeout(pollingTimeoutId);
      }
    };
  }, [pollingTimeoutId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Error Loading Case
            </CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button 
                onClick={() => fetchCaseData()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
              <Link href="/cases">
                <Button variant="ghost">
                  Back to Cases
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>Case Not Found</CardTitle>
            <CardDescription>
              The case you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/cases">
              <Button>Back to Cases</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/cases">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{caseData.client_name}</h1>
          <p className="text-gray-600 mt-1">Case Details & Timeline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Case Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <div className="mt-1">
                  <Badge className={statusConfig[caseData.status]?.color}>
                    {statusConfig[caseData.status]?.label}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Priority</Label>
                <div className="mt-1">
                  <Badge className={priorityConfig[caseData.priority]?.color}>
                    {priorityConfig[caseData.priority]?.label}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="mt-1 text-sm text-gray-900">{caseData.description}</p>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{caseData.client_email}</span>
                </div>
                
                {caseData.client_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{caseData.client_phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Created {formatDate(caseData.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Note Form */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Add Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="note-content">Note Content</Label>
                  <Textarea
                    id="note-content"
                    placeholder="Add a note about this case..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={submitNote}
                  disabled={!noteContent.trim() || submittingNote}
                  className="w-full"
                >
                  {submittingNote ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Note...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Add Note
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights
              </CardTitle>
              <CardDescription>
                AI-powered analysis and recommendations based on case notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiInsight ? (
                <AIInsightCard
                  insight={aiInsight}
                  onRefresh={refreshAIInsights}
                  loading={aiInsightLoading}
                  error={aiInsightError}
                />
              ) : (
                <div className="text-center py-8">
                  {aiInsightError ? (
                    <div className="text-red-600 mb-4">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">{aiInsightError}</p>
                    </div>
                  ) : (
                    <div className="text-gray-500 mb-4">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No AI insights generated yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Select notes from the timeline below and generate insights
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center gap-4">
                    {selectedNotes.size > 0 && (
                      <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                        {selectedNotes.size} note{selectedNotes.size > 1 ? 's' : ''} selected for analysis
                      </div>
                    )}
                    
                    <Button
                      onClick={generateAIInsights}
                      disabled={selectedNotes.size === 0 || generatingInsight}
                      className="flex items-center gap-2"
                    >
                      {generatingInsight ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating Insights...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate AI Insights
                        </>
                      )}
                    </Button>
                    
                    {selectedNotes.size === 0 && (
                      <p className="text-xs text-gray-400 max-w-md text-center">
                        Select one or more notes from the timeline below to analyze with AI
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Case Timeline
                {selectedNotes.size > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedNotes.size} selected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Chronological history of all case activities and notes. Select notes to analyze with AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : timeline.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No timeline events yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add a note to start building the case timeline</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event, index) => {
                    // Add comprehensive error handling for event types
                    if (!event || !event.type) {
                      return null;
                    }
                    
                    const config = eventTypeConfig[event.type as keyof typeof eventTypeConfig] || eventTypeConfig.note;
                    const Icon = config?.icon || MessageSquare;
                    const isNote = event.type === 'note';
                    const isSelected = selectedNotes.has(event.id);
                    
                    return (
                      <div key={event.id} className="relative">
                        {/* Timeline line */}
                        {index < timeline.length - 1 && (
                          <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                        )}
                        
                        <div className={`flex gap-4 p-4 rounded-lg border ${config?.color || 'bg-blue-50 border-blue-200'} ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                          {/* Checkbox for notes */}
                          {isNote && (
                            <div className="flex-shrink-0 pt-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleNoteSelection(event.id)}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </div>
                          )}
                          
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-white border-2 border-current rounded-full flex items-center justify-center">
                              <Icon className="h-4 w-4" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {config?.label || 'Event'}
                                  </span>
                                  {isNote && (
                                    <Badge variant="outline" className="text-xs">
                                      Selectable for AI
                                    </Badge>
                                  )}
                                  {event.user_name && (
                                    <span className="text-xs text-gray-500">
                                      by {event.user_name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {event.content}
                                </p>
                              </div>
                              <div className="flex-shrink-0 ml-4">
                                <span className="text-xs text-gray-500" title={formatDate(event.created_at)}>
                                  {formatRelativeTime(event.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}