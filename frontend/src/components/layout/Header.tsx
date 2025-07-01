'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, LogOut } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const [copySuccess, setCopySuccess] = useState(false);

  if (!user) return null;

  const getPublicIntakeUrl = () => {
    if (!user?.firm_id) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/intake/${user.firm_id}`;
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

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-6">
        {/* Public Intake URL Section */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Public Intake URL</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={getPublicIntakeUrl()}
                readOnly
                className="bg-transparent text-sm font-mono text-green-700 border-none outline-none w-64 truncate"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openPublicForm}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {copySuccess && (
            <span className="text-xs text-green-600 font-medium">Copied!</span>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700 hidden sm:inline">
            Welcome, {user.name}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}