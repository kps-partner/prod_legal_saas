'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiClient, CaseType, CaseTypeCreate, CaseTypeUpdate } from '@/lib/api';
import { RoleGuard } from '@/components/RoleGuard';

export default function CaseTypesPage() {
  const router = useRouter();
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCaseType, setEditingCaseType] = useState<CaseType | null>(null);
  const [formData, setFormData] = useState<CaseTypeCreate>({
    name: '',
    description: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCaseTypes();
  }, []);

  const fetchCaseTypes = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCaseTypes();
      setCaseTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch case types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCaseType = async () => {
    try {
      setSubmitting(true);
      const newCaseType = await apiClient.createCaseType(formData);
      setCaseTypes([...caseTypes, newCaseType]);
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCaseType = async () => {
    if (!editingCaseType) return;

    try {
      setSubmitting(true);
      const updateData: CaseTypeUpdate = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
      };
      const updatedCaseType = await apiClient.updateCaseType(editingCaseType.id, updateData);
      setCaseTypes(caseTypes.map(ct => ct.id === editingCaseType.id ? updatedCaseType : ct));
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update case type');
    } finally {
      setSubmitting(false);
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
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (caseType: CaseType) => {
    setEditingCaseType(caseType);
    setFormData({
      name: caseType.name,
      description: caseType.description || '',
      is_active: caseType.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
    });
    setEditingCaseType(null);
  };

  const handleSubmit = () => {
    if (editingCaseType) {
      handleUpdateCaseType();
    } else {
      handleCreateCaseType();
    }
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
          <div className="text-lg">Loading case types...</div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['Admin']}>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Case Types</h1>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Case Type
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Manage Case Types</CardTitle>
            <CardDescription>
              Configure the different types of cases your firm handles. These will be available when creating intake forms.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
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
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
              <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim()}>
                {submitting ? 'Saving...' : (editingCaseType ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}