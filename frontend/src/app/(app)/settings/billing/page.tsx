'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// For demo purposes, using a test price ID. In production, this would come from environment variables
const STRIPE_PRICE_ID = 'price_1RdwH8Cvk8IU6PphIrsZP9Mo';

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

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
      alert('Failed to access billing portal. Please try again.');
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
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
                  ) : (
                    <span className="text-orange-600 font-medium">Status: Inactive</span>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              {!isSubscriptionActive ? (
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
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Manage Your Subscription</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Access your billing portal to update payment methods, view invoices, or modify your subscription.
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
              )}
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
  );
}