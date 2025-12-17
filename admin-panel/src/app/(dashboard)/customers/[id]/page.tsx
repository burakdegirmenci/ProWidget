'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Settings,
  Layers,
  Palette,
  Rss,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  Key,
  MousePointer2,
  Code2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  ModalFooter,
  LoadingOverlay,
} from '@/components/ui';
import { SelectorModal } from '@/components/widgets/SelectorModal';
import { customersService } from '@/services';
import { formatDate, copyToClipboard, cn } from '@/lib/utils';
import type { Customer, WidgetConfig, Theme, XmlFeed, WidgetType } from '@/types';

// ========================================
// Tab Types
// ========================================

type TabType = 'general' | 'widgets' | 'templates' | 'theme' | 'feed';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  href?: string;
}

const tabs: Tab[] = [
  { id: 'general', label: 'Genel', icon: <Settings className="h-4 w-4" /> },
  { id: 'widgets', label: 'Widget\'lar', icon: <Layers className="h-4 w-4" /> },
  { id: 'templates', label: 'Template\'ler', icon: <Code2 className="h-4 w-4" />, href: 'templates' },
  { id: 'theme', label: 'Tema', icon: <Palette className="h-4 w-4" /> },
  { id: 'feed', label: 'XML Feed', icon: <Rss className="h-4 w-4" /> },
];

// ========================================
// Schemas
// ========================================

const customerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  domain: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  isActive: z.boolean(),
});

const widgetSchema = z.object({
  type: z.enum(['CAROUSEL', 'BANNER', 'POPUP', 'GRID', 'SLIDER', 'CUSTOM'] as const),
  name: z.string().min(2, 'Isim en az 2 karakter olmali'),
});

const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir renk kodu girin'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir renk kodu girin'),
  fontFamily: z.string().optional(),
  borderRadius: z.string().optional(),
});

const feedSchema = z.object({
  name: z.string().min(2, 'Feed adı en az 2 karakter olmalı'),
  url: z.string().url('Geçerli bir URL girin'),
  format: z.enum(['google', 'facebook', 'custom'] as const),
});

// ========================================
// Widget Type Options
// ========================================

const widgetTypeOptions = [
  { value: 'CAROUSEL', label: 'Carousel' },
  { value: 'BANNER', label: 'Banner' },
  { value: 'POPUP', label: 'Popup' },
  { value: 'GRID', label: 'Grid' },
  { value: 'SLIDER', label: 'Slider' },
  { value: 'CUSTOM', label: 'Ozel Template' },
];

const feedFormatOptions = [
  { value: 'google', label: 'Google Merchant' },
  { value: 'facebook', label: 'Facebook Catalog' },
  { value: 'custom', label: 'Custom XML' },
];

// ========================================
// Main Component
// ========================================

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [feed, setFeed] = useState<XmlFeed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [isSelectorModalOpen, setIsSelectorModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<string>('');

  // Forms
  const customerForm = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
  });

  const widgetForm = useForm<z.infer<typeof widgetSchema>>({
    resolver: zodResolver(widgetSchema),
    defaultValues: { type: 'CAROUSEL' as WidgetType, name: '' },
  });

  const themeForm = useForm<z.infer<typeof themeSchema>>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'inherit',
      borderRadius: '8px',
    },
  });

  const feedForm = useForm<z.infer<typeof feedSchema>>({
    resolver: zodResolver(feedSchema),
    defaultValues: { name: '', url: '', format: 'google' },
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [customerData, widgetsData, themeData, feedsData] = await Promise.all([
        customersService.getById(customerId),
        customersService.getWidgets(customerId).catch(() => []),
        customersService.getTheme(customerId).catch(() => null),
        customersService.getFeeds(customerId).catch(() => []),
      ]);

      setCustomer(customerData);
      setWidgets(widgetsData);
      setTheme(themeData);
      // Use the first feed if available (UI supports single feed for simplicity)
      const feedData = feedsData.length > 0 ? feedsData[0] : null;
      setFeed(feedData);

      // Set form values
      customerForm.reset({
        name: customerData.name,
        domain: customerData.domain || '',
        isActive: customerData.isActive,
      });

      if (themeData) {
        themeForm.reset({
          primaryColor: themeData.primaryColor,
          secondaryColor: themeData.secondaryColor,
          fontFamily: themeData.fontFamily,
          borderRadius: themeData.borderRadius,
        });
      }

      if (feedData) {
        feedForm.reset({
          name: feedData.name || '',
          url: feedData.url,
          format: feedData.format,
        });
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [customerId, customerForm, themeForm, feedForm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save customer
  const onSaveCustomer = async (data: z.infer<typeof customerSchema>) => {
    setIsSaving(true);
    try {
      await customersService.update(customerId, {
        name: data.name,
        domain: data.domain || undefined,
        isActive: data.isActive,
      });
      toast.success('Müşteri bilgileri güncellendi');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Kaydetme başarısız');
    } finally {
      setIsSaving(false);
    }
  };

  // Create widget
  const onCreateWidget = async (data: z.infer<typeof widgetSchema>) => {
    setIsSaving(true);
    try {
      await customersService.createWidget(customerId, {
        type: data.type,
        name: data.name,
        placement: selectedPlacement || undefined,
      });
      setIsWidgetModalOpen(false);
      widgetForm.reset();
      setSelectedPlacement('');
      toast.success('Widget oluşturuldu');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Widget oluşturulamadı');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete widget
  const handleDeleteWidget = async (widgetId: string, widgetName: string) => {
    if (!confirm(`"${widgetName}" widget'ını silmek istediğinize emin misiniz?`)) return;

    try {
      await customersService.deleteWidget(customerId, widgetId);
      toast.success('Widget silindi');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Silme başarısız');
    }
  };

  // Save theme
  const onSaveTheme = async (data: z.infer<typeof themeSchema>) => {
    setIsSaving(true);
    try {
      await customersService.updateTheme(customerId, data);
      toast.success('Tema ayarları güncellendi');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Tema kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  // Save feed
  const onSaveFeed = async (data: z.infer<typeof feedSchema>) => {
    setIsSaving(true);
    try {
      if (feed) {
        // Update existing feed
        await customersService.updateFeed(feed.id, data);
        toast.success('Feed güncellendi');
      } else {
        // Create new feed
        await customersService.createFeed(customerId, data);
        toast.success('Feed oluşturuldu');
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Feed kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  // Sync feed
  const handleSyncFeed = async () => {
    if (!feed) return;
    try {
      await customersService.syncFeed(feed.id);
      toast.success('Feed senkronizasyonu başlatıldı');
      // Refresh data to show updated status
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Senkronizasyon başlatılamadı');
    }
  };

  // Copy API key
  const handleCopyApiKey = async () => {
    if (customer?.apiKey) {
      const success = await copyToClipboard(customer.apiKey);
      if (success) toast.success('API Key kopyalandı!');
    }
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!customer) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Müşteri bulunamadı</p>
        <Link href="/customers">
          <Button variant="outline">Müşterilere Dön</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <Badge variant={customer.isActive ? 'success' : 'default'}>
              {customer.isActive ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
          <p className="mt-1 text-gray-500">{customer.slug}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          {tabs.map((tab) => (
            tab.href ? (
              <Link
                key={tab.id}
                href={`/customers/${customerId}/${tab.href}`}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                {tab.icon}
                {tab.label}
              </Link>
            ) : (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Genel Bilgiler</CardTitle>
                <CardDescription>Müşteri temel bilgilerini düzenleyin</CardDescription>
              </CardHeader>
              <form onSubmit={customerForm.handleSubmit(onSaveCustomer)}>
                <CardContent className="space-y-4">
                  <Input
                    {...customerForm.register('name')}
                    label="Müşteri Adı"
                    error={customerForm.formState.errors.name?.message}
                  />
                  <Input
                    {...customerForm.register('domain')}
                    label="Domain"
                    placeholder="https://example.com"
                    error={customerForm.formState.errors.domain?.message}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...customerForm.register('isActive')}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Aktif</span>
                  </label>
                </CardContent>
                <CardFooter>
                  <Button type="submit" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
                    Kaydet
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Bilgileri</CardTitle>
                <CardDescription>Entegrasyon için gerekli bilgiler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm">
                      {customer.slug}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(customer.slug)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">API Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-gray-100 px-3 py-2 text-sm">
                      {customer.apiKey}
                    </code>
                    <Button variant="outline" size="sm" onClick={handleCopyApiKey}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Embed Kodu
                  </label>
                  <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
{`<script
  src="https://cdn.prowidget.com/pwx.min.js"
  data-pwx-customer="${customer.slug}"
></script>

<div data-pwx-widget="carousel"></div>`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Widgets Tab */}
        {activeTab === 'widgets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{widgets.length} widget tanımlı</p>
              <Button
                onClick={() => setIsWidgetModalOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Yeni Widget
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {widgets.map((widget) => (
                <Card key={widget.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{widget.name}</h3>
                        <Badge size="sm" className="mt-1">
                          {widget.type}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWidget(widget.id, widget.name)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {widget.placement && (
                      <div className="mt-2">
                        <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {widget.placement}
                        </code>
                      </div>
                    )}
                    <div className="mt-3 text-sm text-gray-500">
                      <Badge variant={widget.isActive ? 'success' : 'default'} size="sm">
                        {widget.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {widgets.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layers className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-gray-500">Henüz widget tanımlanmamış</p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsWidgetModalOpen(true)}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    İlk Widget'ı Oluştur
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Theme Tab */}
        {activeTab === 'theme' && (
          <Card>
            <CardHeader>
              <CardTitle>Tema Ayarları</CardTitle>
              <CardDescription>Widget görünümünü özelleştirin</CardDescription>
            </CardHeader>
            <form onSubmit={themeForm.handleSubmit(onSaveTheme)}>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Ana Renk
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        {...themeForm.register('primaryColor')}
                        className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                      />
                      <Input {...themeForm.register('primaryColor')} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      İkincil Renk
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        {...themeForm.register('secondaryColor')}
                        className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                      />
                      <Input {...themeForm.register('secondaryColor')} className="flex-1" />
                    </div>
                  </div>
                </div>
                <Input
                  {...themeForm.register('fontFamily')}
                  label="Font Ailesi"
                  placeholder="Inter, sans-serif"
                />
                <Input
                  {...themeForm.register('borderRadius')}
                  label="Border Radius"
                  placeholder="8px"
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
                  Kaydet
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <Card>
            <CardHeader>
              <CardTitle>XML Feed Ayarları</CardTitle>
              <CardDescription>Ürün verisi kaynağını yapılandırın</CardDescription>
            </CardHeader>
            <form onSubmit={feedForm.handleSubmit(onSaveFeed)}>
              <CardContent className="space-y-4">
                <Input
                  {...feedForm.register('name')}
                  label="Feed Adı"
                  placeholder="Google Merchant Feed"
                  error={feedForm.formState.errors.name?.message}
                />
                <Input
                  {...feedForm.register('url')}
                  label="Feed URL"
                  placeholder="https://example.com/products.xml"
                  error={feedForm.formState.errors.url?.message}
                />
                <Select
                  {...feedForm.register('format')}
                  label="Feed Formatı"
                  options={feedFormatOptions}
                />
                {feed && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-700">Feed Durumu</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        Durum:{' '}
                        <Badge
                          variant={feed.status === 'active' ? 'success' : feed.status === 'error' ? 'danger' : 'warning'}
                        >
                          {feed.status === 'active' ? 'Aktif' : feed.status === 'error' ? 'Hata' : feed.status === 'syncing' ? 'Senkronize Ediliyor' : 'Beklemede'}
                        </Badge>
                      </p>
                      <p>Ürün Sayısı: {feed.productCount || 0}</p>
                      {feed.lastSync && (
                        <p>Son Senkronizasyon: {formatDate(feed.lastSync)}</p>
                      )}
                      {feed.lastError && (
                        <p className="text-red-600">Hata: {feed.lastError}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSyncFeed}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  disabled={!feed}
                >
                  Şimdi Senkronize Et
                </Button>
                <Button type="submit" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
                  Kaydet
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>

      {/* Create Widget Modal */}
      <Modal
        isOpen={isWidgetModalOpen}
        onClose={() => {
          setIsWidgetModalOpen(false);
          widgetForm.reset();
          setSelectedPlacement('');
        }}
        title="Yeni Widget Oluştur"
        size="lg"
      >
        <form onSubmit={widgetForm.handleSubmit(onCreateWidget)}>
          <div className="space-y-4">
            <Select
              {...widgetForm.register('type')}
              label="Widget Tipi"
              options={widgetTypeOptions}
            />
            <Input
              {...widgetForm.register('name')}
              label="Widget Adı"
              placeholder="Ana Sayfa Carousel"
              error={widgetForm.formState.errors.name?.message}
            />

            {/* Placement Seçimi */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Yerleşim (Placement)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={selectedPlacement}
                  onChange={(e) => setSelectedPlacement(e.target.value)}
                  placeholder="#pwx-widgets"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSelectorModalOpen(true)}
                  className="shrink-0"
                >
                  <MousePointer2 className="mr-2 h-4 w-4" />
                  Görsel Seç
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                CSS selector girin veya &quot;Görsel Seç&quot; ile siteden tıklayarak seçin
              </p>
            </div>
          </div>
          <ModalFooter className="-mx-6 -mb-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsWidgetModalOpen(false);
                widgetForm.reset();
                setSelectedPlacement('');
              }}
            >
              İptal
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Oluştur
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Selector Modal */}
      <SelectorModal
        isOpen={isSelectorModalOpen}
        onClose={() => setIsSelectorModalOpen(false)}
        onSelect={(selector) => {
          setSelectedPlacement(selector);
          setIsSelectorModalOpen(false);
        }}
        customerDomain={customer?.domain || undefined}
      />
    </div>
  );
}
