'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CaseAnalytics } from '@/components/analytics/CaseAnalytics';
import { GmailPermissionAlert } from '@/components/GmailPermissionAlert';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { apiClient } from '@/lib/api';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean;
    calendar_name?: string;
    loading: boolean;
    has_gmail_permissions?: boolean;
    needs_reauth?: boolean;
  }>({ connected: false, loading: true });

  // Check if user returned from successful payment and refresh user data
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      // Refresh user data to get updated subscription status
      refreshUser();
      
      // Clean up the URL by removing the success parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, refreshUser]);

  // Fetch Google Calendar connection status
  useEffect(() => {
    const fetchCalendarStatus = async () => {
      try {
        const status = await apiClient.getGoogleCalendarStatus();
        setCalendarStatus({
          connected: status.connected,
          calendar_name: status.calendar_name,
          has_gmail_permissions: status.has_gmail_permissions,
          needs_reauth: status.needs_reauth,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch calendar status:', error);
        setCalendarStatus({ connected: false, loading: false });
      }
    };

    if (user) {
      fetchCalendarStatus();
    }
  }, [user]);

  // Handle successful reauthorization
  const handleReauthSuccess = () => {
    // Refresh calendar status after successful reauth
    const fetchCalendarStatus = async () => {
      try {
        const status = await apiClient.getGoogleCalendarStatus();
        setCalendarStatus({
          connected: status.connected,
          calendar_name: status.calendar_name,
          has_gmail_permissions: status.has_gmail_permissions,
          needs_reauth: status.needs_reauth,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch calendar status:', error);
      }
    };
    fetchCalendarStatus();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Subscription Banner */}
      <SubscriptionBanner />

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-600 text-sm">Overview of your law firm&apos;s performance and key metrics</p>
      </div>

      {/* Gmail Permission Alert - Show when connected but missing Gmail permissions */}
      {calendarStatus.connected && calendarStatus.needs_reauth && (
        <div className="mb-4">
          <GmailPermissionAlert onReauthSuccess={handleReauthSuccess} />
        </div>
      )}

      {/* Case Analytics Section */}
      <div className="mb-4">
        <CaseAnalytics />
      </div>
    </div>
  );
}