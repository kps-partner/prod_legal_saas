'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Calendar, Brain, Clock, TrendingUp, Zap, Target } from 'lucide-react';
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
              <h1 className="text-xl font-bold text-gray-900">IntakeIntel</h1>
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
            Intelligent Client Intake & Case Management
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered client intake platform that streamlines case management, automates scheduling,
            and provides intelligent insights to help law firms grow their practice efficiently.
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

        {/* Benefits Section */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Why Law Firms Choose IntakeIntel
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Proven results that transform your practice with measurable efficiency gains
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Save 10+ Hours Weekly</h4>
              <p className="text-gray-600">
                Automate administrative tasks and focus on high-value legal work that drives revenue
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h4 className="text-2xl font-bold text-gray-900 mb-2">40% Higher Conversion</h4>
              <p className="text-gray-600">
                Smart intake forms and automated follow-up systems increase client acquisition rates
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h4 className="text-2xl font-bold text-gray-900 mb-2">50% Faster Processing</h4>
              <p className="text-gray-600">
                AI-powered case triage and workflow automation accelerate case resolution times
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Target className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h4 className="text-2xl font-bold text-gray-900 mb-2">3x Return on Investment</h4>
              <p className="text-gray-600">
                Measurable efficiency gains that pay for the platform within months of implementation
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
