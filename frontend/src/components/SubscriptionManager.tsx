'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SubscriptionManagerProps {
  token: string
}

export default function SubscriptionManager({ token }: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const createCheckoutSession = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          price_id: 'price_1RdwH8Cvk8IU6PphIrsZP9Mo' // Real Stripe price ID
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create checkout session')
      }

      const checkoutSession = await response.json()
      
      // In a real implementation, you would redirect to Stripe Checkout
      setSuccess(`Checkout session created! Session ID: ${checkoutSession.id}`)
      
      // Simulate redirect to Stripe Checkout
      console.log('Checkout Session:', checkoutSession)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>
          Manage your law firm&apos;s subscription plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold">Professional Plan</h3>
          <p className="text-sm text-gray-600">
            Full access to all IntakeIntel features
          </p>
          <p className="text-lg font-bold">$99/month</p>
        </div>

        <Button 
          onClick={createCheckoutSession}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating Session...' : 'Subscribe Now'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Powered by Stripe. Secure payment processing.
        </p>
      </CardContent>
    </Card>
  )
}