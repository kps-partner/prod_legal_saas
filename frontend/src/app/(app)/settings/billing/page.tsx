'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/RoleGuard';

// For demo purposes, using a test price ID. In production, this would come from environment variables
const STRIPE_PRICE_ID = 'price_1RdwH8Cvk8IU6PphIrsZP9Mo';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const formatSubscriptionEndDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return null;
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubscribeNow = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiClient.createCheckoutSession(STRIPE_PRICE_ID);
      // Redirect to Stripe checkout
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start subscription process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiClient.createCustomerPortalSession();
      // Redirect to Stripe customer portal
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to create customer portal session:', error);
      
      // Check if this is a customer portal configuration error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('customer portal settings') || errorMessage.includes('No configuration provided')) {
        alert('The billing portal is not yet configured. Please contact support or set up the customer portal in your Stripe Dashboard.');
      } else {
        alert('Failed to access billing portal. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period.'
    );
    
    if (!confirmed) return;
    
    setCancelLoading(true);
    try {
      const response = await apiClient.cancelSubscription();
      alert(`Subscription canceled successfully. You will retain access until ${new Date(response.current_period_end * 1000).toLocaleDateString()}.`);
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  const isSubscriptionActive = user.subscription_status === 'active';
  const isSubscriptionCanceling = user.subscription_status === 'canceling';

  return (
    <RoleGuard allowedRoles={['Admin']}>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              ← Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Current Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSubscriptionActive ? (
                      <span className="text-green-600 font-medium">Status: Active</span>
                    ) : isSubscriptionCanceling ? (
                      <span className="text-yellow-600 font-medium">
                        Status: Canceling
                        {user.subscription_ends_at && (
                          <span> (Ends {formatSubscriptionEndDate(user.subscription_ends_at)})</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-orange-600 font-medium">Status: Inactive</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                {!isSubscriptionActive && !isSubscriptionCanceling ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Get Started</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Subscribe to unlock all features and start managing your law firm efficiently.
                      </p>
                    </div>
                    <Button
                      onClick={handleSubscribeNow}
                      disabled={loading}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {loading ? 'Processing...' : 'Subscribe Now'}
                    </Button>
                  </div>
                ) : isSubscriptionActive ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Manage Your Subscription</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Access your billing portal to update payment methods, view invoices, or modify your subscription.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleManageBilling}
                        disabled={loading}
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        {loading ? 'Processing...' : 'Manage Billing'}
                      </Button>
                      <Button
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                        variant="destructive"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        {cancelLoading ? 'Canceling...' : 'Cancel Subscription'}
                      </Button>
                    </div>
                  </div>
                ) : isSubscriptionCanceling ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Subscription Canceling</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your subscription is set to cancel{user.subscription_ends_at
                          ? ` on ${formatSubscriptionEndDate(user.subscription_ends_at)}`
                          : ' at the end of the current billing period'
                        }. You will retain access until then. You can still manage your billing through the customer portal.
                      </p>
                    </div>
                    <Button
                      onClick={handleManageBilling}
                      disabled={loading}
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {loading ? 'Processing...' : 'Manage Billing'}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  <p>
                    Questions about billing? Contact our support team for assistance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}