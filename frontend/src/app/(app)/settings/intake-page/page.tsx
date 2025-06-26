'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Copy, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient, IntakePageSetting, IntakePageSettingUpdate, User } from '@/lib/api';

export default function IntakePageSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<IntakePageSetting | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<IntakePageSettingUpdate>({
    welcome_message: '',
    logo_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsData, userData] = await Promise.all([
        apiClient.getIntakePageSettings(),
        apiClient.getCurrentUser()
      ]);
      
      setSettings(settingsData);
      setCurrentUser(userData);
      setFormData({
        welcome_message: settingsData.welcome_message,
        logo_url: settingsData.logo_url || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      const updatedSettings = await apiClient.updateIntakePageSettings(formData);
      setSettings(updatedSettings);
      setSuccessMessage('Intake page settings updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update intake page settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof IntakePageSettingUpdate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPublicIntakeUrl = () => {
    if (!currentUser?.firm_id) {
      console.warn('No firm_id found for current user:', currentUser);
      return '';
    }
    const baseUrl = window.location.origin;
    const publicUrl = `${baseUrl}/intake/${currentUser.firm_id}`;
    console.log('Generated public intake URL:', publicUrl);
    return publicUrl;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getPublicIntakeUrl());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const openPublicForm = () => {
    window.open(getPublicIntakeUrl(), '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading intake page settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Intake Page Settings</h1>
        </div>
        <Button onClick={handleSave} disabled={submitting}>
          <Save className="h-4 w-4 mr-2" />
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Public Intake Form URL</CardTitle>
            <CardDescription>
              Share this URL with prospective clients so they can submit intake requests directly to your firm.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="public_url">Public Intake Form URL</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="public_url"
                    value={getPublicIntakeUrl()}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openPublicForm}
                    className="flex-shrink-0"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  This is the public URL that prospective clients can use to submit intake forms.
                  You can share this link on your website, in emails, or anywhere you want to collect new client information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Welcome Message</CardTitle>
            <CardDescription>
              This message will be displayed at the top of your public intake form to welcome potential clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="welcome_message">Welcome Message</Label>
                <Textarea
                  id="welcome_message"
                  value={formData.welcome_message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    handleInputChange('welcome_message', e.target.value)
                  }
                  placeholder="Welcome to our law firm! Please fill out this form to get started with your case..."
                  rows={4}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-2">
                  This message helps set the tone for your intake process and can include instructions or reassuring information for potential clients.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Customize the appearance of your intake form with your firm's branding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter the URL of your firm's logo. It should be a publicly accessible image (PNG, JPG, or SVG recommended).
                </p>
              </div>
              
              {formData.logo_url && (
                <div>
                  <Label>Logo Preview</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                    <img
                      src={formData.logo_url}
                      alt="Logo preview"
                      className="max-h-16 max-w-48 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Here's how your intake form header will look to potential clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-white">
              {formData.logo_url && (
                <div className="mb-4">
                  <img
                    src={formData.logo_url}
                    alt="Firm logo"
                    className="max-h-12 max-w-48 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="prose max-w-none">
                <p className="text-lg leading-relaxed">
                  {formData.welcome_message || 'Your welcome message will appear here...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={submitting} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {submitting ? 'Saving Changes...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}