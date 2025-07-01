'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { KanbanBoard } from '@/components/KanbanBoard';
import { CaseAnalytics } from '@/components/analytics/CaseAnalytics';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

interface CasesResponse {
  cases: Case[];
  total: number;
}

export default function CasesPage() {
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    setToken(accessToken);
  }, []);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const fetchCases = async (includeArchived = false) => {
    if (!token) return;

    try {
      setLoading(true);
      const endpoint = includeArchived 
        ? 'http://localhost:8000/api/v1/cases/archived'
        : 'http://localhost:8000/api/v1/cases';
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cases: ${response.statusText}`);
      }

      const data: CasesResponse = await response.json();
      setCases(data.cases);
      setError(null);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const updateCaseStatus = async (caseId: string, newStatus: Case['status']) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update case status: ${response.statusText}`);
      }

      // Refresh cases after successful update
      await fetchCases(showArchived);
    } catch (err) {
      console.error('Error updating case status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update case status');
    }
  };

  useEffect(() => {
    fetchCases(showArchived);
  }, [token, showArchived]);

  const handleArchivedToggle = (checked: boolean) => {
    setShowArchived(checked);
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

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Error Loading Cases
            </CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => fetchCases(showArchived)}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
            <p className="text-gray-600 mt-1">Manage your cases with a visual Kanban board</p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={handleArchivedToggle}
            />
            <Label htmlFor="show-archived">Show Archived</Label>
          </div>
        </div>

        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">No Cases Yet</CardTitle>
            <CardDescription className="text-gray-600 max-w-md mx-auto">
              {showArchived 
                ? "No archived cases found. Switch to active cases to see your current workload."
                : "Get started by setting up your intake forms to begin receiving new cases automatically."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/settings/integrations">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Setup Intake Forms
                </Button>
              </Link>
              <Button 
                variant="outline"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? 'View Active Cases' : 'View Archived Cases'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
          <p className="text-gray-600 mt-1">
            {showArchived ? 'Archived cases' : `${cases.length} active cases`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={handleArchivedToggle}
          />
          <Label htmlFor="show-archived">Show Archived</Label>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mb-8">
        <CaseAnalytics />
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        cases={cases}
        onStatusChange={updateCaseStatus}
        showArchived={showArchived}
      />
    </div>
  );
}