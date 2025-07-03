'use client';

import { useAuth } from '@/context/AuthContext';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function SubscriptionBanner() {
  const { user } = useAuth();

  // Don't render if no user or subscription is active
  if (!user || user.subscription_status !== 'inactive') {
    return null;
  }

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50 border-l-4 border-l-orange-400">
      <AlertTriangle className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-orange-800 font-semibold">
        Activate Full Features
      </AlertTitle>
      <AlertDescription className="text-orange-700">
        <div className="flex items-center justify-between">
          <span>
            Activate your subscription to access the full feature
          </span>
          <Button asChild className="ml-4 bg-orange-600 hover:bg-orange-700 text-white">
            <Link href="/settings/billing">
              Subscribe Now
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}