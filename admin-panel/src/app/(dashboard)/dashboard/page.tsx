'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Layers,
  Package,
  TrendingUp,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, LoadingOverlay } from '@/components/ui';
import { dashboardService, customersService } from '@/services';
import { formatDate, formatNumber } from '@/lib/utils';
import type { DashboardStats, Customer } from '@/types';

// ========================================
// Stat Card Component
// ========================================

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {typeof value === 'number' ? formatNumber(value) : value}
            </p>
            {trend && (
              <p
                className={`mt-2 flex items-center text-sm ${
                  trendUp ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <TrendingUp className={`mr-1 h-4 w-4 ${!trendUp && 'rotate-180'}`} />
                {trend}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-primary-50 p-3 text-primary-600">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========================================
// Main Component
// ========================================

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch stats and recent customers in parallel
      const [statsData, customersData] = await Promise.all([
        dashboardService.getStats().catch(() => null),
        customersService.getAll({ limit: 5 }).catch(() => ({ customers: [] })),
      ]);

      // If stats API doesn't exist, use mock data
      setStats(
        statsData || {
          totalCustomers: customersData.customers.length,
          activeCustomers: customersData.customers.filter((c) => c.isActive).length,
          totalWidgets: 0,
          activeWidgets: 0,
          totalProducts: 0,
          recentCustomers: customersData.customers,
        }
      );
      setRecentCustomers(customersData.customers);
    } catch (err: any) {
      setError(err.message || 'Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchData} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">ProWidget genel bakış</p>
        </div>
        <Button onClick={fetchData} variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />}>
          Yenile
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Müşteri"
          value={stats?.totalCustomers || 0}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Aktif Müşteri"
          value={stats?.activeCustomers || 0}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Toplam Widget"
          value={stats?.totalWidgets || 0}
          icon={<Layers className="h-6 w-6" />}
        />
        <StatCard
          title="Toplam Ürün"
          value={stats?.totalProducts || 0}
          icon={<Package className="h-6 w-6" />}
        />
      </div>

      {/* Recent Customers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Son Eklenen Müşteriler</CardTitle>
          <Link href="/customers">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Tümünü Gör
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentCustomers.length === 0 ? (
            <p className="py-8 text-center text-gray-500">Henüz müşteri bulunmuyor</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600"
                    >
                      {customer.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-gray-500">{customer.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={customer.isActive ? 'success' : 'default'}>
                      {customer.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDate(customer.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/customers">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Müşteri Yönetimi</h3>
                <p className="text-sm text-gray-500">Müşterileri görüntüle ve yönet</p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
