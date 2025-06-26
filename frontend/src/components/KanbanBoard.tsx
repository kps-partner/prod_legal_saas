'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Mail, Phone, Clock, AlertCircle, CheckCircle2, Users, FileText, Archive } from 'lucide-react';

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
  const [draggedCase, setDraggedCase] = useState<Case | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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
    return cases.filter(caseItem => caseItem.status === status);
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
            <div className="p-4 space-y-3 min-h-[200px]">
              {statusCases.map((caseItem) => (
                <Card
                  key={caseItem.id}
                  className="cursor-move hover:shadow-md transition-shadow duration-200 bg-white"
                  draggable
                  onDragStart={(e) => handleDragStart(e, caseItem)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium text-gray-900 line-clamp-2">
                        {caseItem.client_name}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={`${priorityConfig[caseItem.priority]?.color || 'bg-gray-100 text-gray-800'} text-xs`}
                      >
                        {priorityConfig[caseItem.priority]?.label || 'Unknown'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs text-gray-600 line-clamp-2 mb-3">
                      {caseItem.description}
                    </CardDescription>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{caseItem.client_email}</span>
                      </div>
                      
                      {caseItem.client_phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="h-3 w-3" />
                          <span>{caseItem.client_phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Created {formatDate(caseItem.created_at)}</span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex gap-1">
                        {status !== 'closed' && status !== 'archived' && (
                          <>
                            {status === 'new_lead' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2"
                                onClick={() => onStatusChange(caseItem.id, 'meeting_scheduled')}
                              >
                                Schedule
                              </Button>
                            )}
                            {status === 'meeting_scheduled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2"
                                onClick={() => onStatusChange(caseItem.id, 'pending_review')}
                              >
                                Review
                              </Button>
                            )}
                            {status === 'pending_review' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2"
                                onClick={() => onStatusChange(caseItem.id, 'engaged')}
                              >
                                Engage
                              </Button>
                            )}
                            {status === 'engaged' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2"
                                onClick={() => onStatusChange(caseItem.id, 'closed')}
                              >
                                Close
                              </Button>
                            )}
                          </>
                        )}
                        
                        {status === 'closed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 px-2"
                            onClick={() => onStatusChange(caseItem.id, 'archived')}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
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