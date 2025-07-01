'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Calendar, 
  CreditCard, 
  Settings,
  Building2
} from 'lucide-react';

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navigationItems: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    icon: LayoutDashboard, 
    roles: ['Admin', 'Paralegal'] 
  },
  { 
    name: 'Case Management', 
    path: '/cases', 
    icon: Briefcase, 
    roles: ['Admin', 'Paralegal'] 
  },
  { 
    name: 'Intake Page Settings', 
    path: '/settings/intake-page', 
    icon: FileText, 
    roles: ['Admin'] 
  },
  { 
    name: 'Schedule', 
    path: '/settings/integrations', 
    icon: Calendar, 
    roles: ['Admin'] 
  },
  { 
    name: 'Subscription', 
    path: '/settings/billing', 
    icon: CreditCard, 
    roles: ['Admin'] 
  },
  { 
    name: 'Settings', 
    path: '/settings', 
    icon: Settings, 
    roles: ['Admin', 'Paralegal'] 
  },
];

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Filter navigation items based on user role
  const allowedItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (path === '/settings') {
      return pathname === '/settings' && !pathname.startsWith('/settings/');
    }
    if (path.startsWith('/settings/')) {
      return pathname.startsWith(path);
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <div className="flex items-center">
          <Building2 className="h-8 w-8 text-blue-400 mr-3" />
          <h1 className="text-xl font-semibold text-white">LawFirm OS</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}