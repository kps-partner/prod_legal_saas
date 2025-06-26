'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, AlertTriangle, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface GmailPermissionAlertProps {
  onReauthSuccess?: () => void;
  className?: string;
}

export function GmailPermissionAlert({ onReauthSuccess, className }: GmailPermissionAlertProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleReauthorize = async () => {
    setConnecting(true);
    setError('');
    
    try {
      const data = await apiClient.getGoogleAuthUrl();
      // Redirect to Google OAuth with additional Gmail permissions
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Error getting reauth URL:', error);
      setError('Failed to start reauthorization process');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Mail className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-amber-800">Gmail Permissions Required</span>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            To send email notifications to clients after intake form submissions, we need additional Gmail permissions. 
            This is a one-time setup that will enable automatic email confirmations.
          </p>
          {error && (
            <p className="text-sm text-red-600 mb-2">{error}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <Button
            onClick={handleReauthorize}
            disabled={connecting}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            {connecting ? 'Connecting...' : 'Grant Gmail Access'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}