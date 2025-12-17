'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ========================================
// Types
// ========================================

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

// ========================================
// Navigation Items
// ========================================

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: 'Dashboard',
  },
  {
    href: '/customers',
    icon: <Users className="h-5 w-5" />,
    label: 'Müşteriler',
  },
];

// ========================================
// Component
// ========================================

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Layers className="h-8 w-8 text-primary-600" />
            <span className="text-lg font-bold text-gray-900">PWX Admin</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600',
            isCollapsed && 'mx-auto'
          )}
        >
          <ChevronLeft
            className={cn('h-5 w-5 transition-transform', isCollapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        {/* User info */}
        {!isCollapsed && user && (
          <div className="mb-3 truncate text-sm">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-gray-500">{user.email}</p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Çıkış Yap' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
