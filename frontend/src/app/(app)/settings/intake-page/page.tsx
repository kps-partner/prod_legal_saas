'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Copy, ExternalLink, Plus, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiClient, IntakePageSetting, IntakePageSettingUpdate, User, CaseType, CaseTypeCreate, CaseTypeUpdate } from '@/lib/api';
import { RoleGuard } from '@/components/RoleGuard';

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

  // Case Types state
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCaseType, setEditingCaseType] = useState<CaseType | null>(null);
  const [caseTypeFormData, setCaseTypeFormData] = useState<CaseTypeCreate>({
    name: '',
    description: '',
    is_active: true,
  });
  const [caseTypeSubmitting, setCaseTypeSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsData, userData, caseTypesData] = await Promise.all([
        apiClient.getIntakePageSettings(),
        apiClient.getCurrentUser(),
        apiClient.getCaseTypes()
      ]);
      
      setSettings(settingsData);
      setCurrentUser(userData);
      setCaseTypes(caseTypesData);
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

  // Case Type Management Functions
  const handleCreateCaseType = async () => {
    try {
      setCaseTypeSubmitting(true);
      const newCaseType = await apiClient.createCaseType(caseTypeFormData);
      setCaseTypes([...caseTypes, newCaseType]);
      setIsDialogOpen(false);
      resetCaseTypeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case type');
    } finally {
      setCaseTypeSubmitting(false);
    }
  };

  const handleUpdateCaseType = async () => {
    if (!editingCaseType) return;

    try {
      setCaseTypeSubmitting(true);
      const updateData: CaseTypeUpdate = {
        name: caseTypeFormData.name,
        description: caseTypeFormData.description,
        is_active: caseTypeFormData.is_active,
      };
      const updatedCaseType = await apiClient.updateCaseType(editingCaseType.id, updateData);
      setCaseTypes(caseTypes.map(ct => ct.id === editingCaseType.id ? updatedCaseType : ct));
      setIsDialogOpen(false);
      resetCaseTypeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update case type');
    } finally {
      setCaseTypeSubmitting(false);
    }
  };

  const handleDeleteCaseType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this case type?')) return;

    try {
      await apiClient.deleteCaseType(id);
      setCaseTypes(caseTypes.filter(ct => ct.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete case type');
    }
  };

  const openCreateDialog = () => {
    setEditingCaseType(null);
    resetCaseTypeForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (caseType: CaseType) => {
    setEditingCaseType(caseType);
    setCaseTypeFormData({
      name: caseType.name,
      description: caseType.description || '',
      is_active: caseType.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetCaseTypeForm = () => {
    setCaseTypeFormData({
      name: '',
      description: '',
      is_active: true,
    });
    setEditingCaseType(null);
  };

  const handleCaseTypeSubmit = () => {
    if (editingCaseType) {
      handleUpdateCaseType();
    } else {
      handleCreateCaseType();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading intake page settings...</div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['Admin']}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Intake Page Settings</h1>
            <p className="text-gray-600 mt-1">Configure your public intake form and case types</p>
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

        <div className="space-y-6">
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
                Customize the appearance of your intake form with your firm&apos;s branding.
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
                    Enter the URL of your firm&apos;s logo. It should be a publicly accessible image (PNG, JPG, or SVG recommended).
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
                Here&apos;s how your intake form header will look to potential clients.
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

          {/* Case Types Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium">Case Types</h3>
                <p className="text-sm text-gray-500">
                  Configure the different types of cases your firm handles. These will be available when creating intake forms.
                </p>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Case Type
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {caseTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No case types configured yet.</p>
                    <Button onClick={openCreateDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Case Type
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseTypes.map((caseType) => (
                        <TableRow key={caseType.id}>
                          <TableCell className="font-medium">{caseType.name}</TableCell>
                          <TableCell>{caseType.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={caseType.is_active ? 'default' : 'secondary'}>
                              {caseType.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(caseType.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(caseType)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCaseType(caseType.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={submitting} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCaseType ? 'Edit Case Type' : 'Add New Case Type'}
              </DialogTitle>
              <DialogDescription>
                {editingCaseType
                  ? 'Update the case type information below.'
                  : 'Create a new case type for your intake forms.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={caseTypeFormData.name}
                  onChange={(e) => setCaseTypeFormData({ ...caseTypeFormData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Personal Injury"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={caseTypeFormData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaseTypeFormData({ ...caseTypeFormData, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Brief description of this case type"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  Status
                </Label>
                <div className="col-span-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={caseTypeFormData.is_active}
                      onChange={(e) => setCaseTypeFormData({ ...caseTypeFormData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCaseTypeSubmit} disabled={caseTypeSubmitting || !caseTypeFormData.name.trim()}>
                {caseTypeSubmitting ? 'Saving...' : (editingCaseType ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}