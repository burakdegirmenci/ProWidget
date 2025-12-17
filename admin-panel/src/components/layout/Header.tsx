'use client';

import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getInitials } from '@/lib/utils';

// ========================================
// Types
// ========================================

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

// ========================================
// Component
// ========================================

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Title */}
        {title && <h1 className="text-xl font-semibold text-gray-900">{title}</h1>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Ara..."
            className="w-64 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600'
              )}
            >
              {getInitials(user.name)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
