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
  Building2,
  Lock
} from 'lucide-react';
import { User } from '@/lib/api';

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  requiresSubscription?: boolean;
}

interface NavigationState {
  visible: boolean;
  disabled: boolean;
  tooltip?: string;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['Admin', 'Paralegal'],
    requiresSubscription: false
  },
  {
    name: 'Case Management',
    path: '/cases',
    icon: Briefcase,
    roles: ['Admin', 'Paralegal'],
    requiresSubscription: true // 🔒 Requires subscription
  },
  {
    name: 'Intake Page Settings',
    path: '/settings/intake-page',
    icon: FileText,
    roles: ['Admin'],
    requiresSubscription: true // 🔒 Requires subscription
  },
  {
    name: 'Schedule',
    path: '/settings/integrations',
    icon: Calendar,
    roles: ['Admin'],
    requiresSubscription: true // 🔒 Requires subscription
  },
  {
    name: 'Subscription',
    path: '/settings/billing',
    icon: CreditCard,
    roles: ['Admin'],
    requiresSubscription: false
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ['Admin', 'Paralegal'],
    requiresSubscription: false
  },
];

// Helper function to determine navigation state based on user and subscription
const getNavigationState = (item: NavigationItem, user: User): NavigationState => {
  const hasRole = item.roles.includes(user.role);
  const hasActiveSubscription = user.subscription_status === 'active' ||
                               user.subscription_status === 'canceling';
  const isDisabled = Boolean(item.requiresSubscription && !hasActiveSubscription);
  
  return {
    visible: hasRole,
    disabled: isDisabled,
    tooltip: isDisabled ? 'Subscription required for this feature' : undefined
  };
};

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Get navigation items with their states (visible, disabled, tooltip)
  const navigationStates = navigationItems.map(item => ({
    item,
    state: getNavigationState(item, user)
  })).filter(({ state }) => state.visible);

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

  const handleNavClick = (e: React.MouseEvent, item: NavigationItem, disabled: boolean) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <div className="flex items-center">
          <Building2 className="h-8 w-8 text-blue-400 mr-3" />
          <h1 className="text-xl font-semibold text-white">IntakeIntel</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationStates.map(({ item, state }) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const disabled = state.disabled;
          
          return (
            <div key={item.path} className="relative group">
              <Link
                href={disabled ? '#' : item.path}
                onClick={(e) => handleNavClick(e, item, disabled)}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative',
                  disabled
                    ? 'text-gray-500 cursor-not-allowed'
                    : active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
                title={state.tooltip}
              >
                <div className="flex items-center">
                  <Icon className={cn(
                    "h-5 w-5 mr-3",
                    disabled && "opacity-50"
                  )} />
                  <span className={disabled ? "opacity-50" : ""}>
                    {item.name}
                  </span>
                  {disabled && (
                    <Lock className="h-3 w-3 ml-2 opacity-50" />
                  )}
                </div>
              </Link>
              
              {/* Tooltip for disabled items */}
              {disabled && state.tooltip && (
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {state.tooltip}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                </div>
              )}
            </div>
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
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 leading-relaxed">
            Have feedback / questions? Email us at{' '}
            <a
              href="mailto:kps.product.partner@gmail.com?subject=IntakeIntel Feedback"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              kps.product.partner@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}