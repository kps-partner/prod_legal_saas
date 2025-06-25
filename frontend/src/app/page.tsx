'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Calendar, Brain } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">LawFirm OS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Streamline Your Law Firm with AI-Powered Management
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete SaaS solution for law firms featuring client intake, scheduling,
            case triage, and intelligent automation to help you focus on what matters most.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register">
              <Button size="lg" className="px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Client Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Streamlined client intake and comprehensive case management system
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated appointment scheduling with calendar integration
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>AI Case Triage</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Intelligent case prioritization and resource allocation
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Building2 className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Firm Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive reporting and business intelligence dashboard
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Sprint Progress */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Development Progress</CardTitle>
            <CardDescription>Current implementation status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Sprint S1: Core User & Firm Onboarding</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">✓ Complete</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Sprint S2: Stripe Subscription & Billing</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">Upcoming</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Sprint S3: Client Intake & Management</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">Planned</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Sprint S4: AI-Powered Case Triage</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">Planned</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
