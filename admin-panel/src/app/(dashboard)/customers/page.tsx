'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Key,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Modal,
  ModalFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  LoadingOverlay,
} from '@/components/ui';
import { customersService } from '@/services';
import { formatDate, slugify, copyToClipboard, debounce } from '@/lib/utils';
import type { Customer, CustomerCreateInput } from '@/types';

// ========================================
// Validation Schema
// ========================================

const createCustomerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  slug: z
    .string()
    .min(2, 'Slug en az 2 karakter olmalı')
    .regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve tire kullanılabilir'),
  domain: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
});

type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;

// ========================================
// Main Component
// ========================================

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerFormData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
    },
  });

  const watchName = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (watchName) {
      setValue('slug', slugify(watchName));
    }
  }, [watchName, setValue]);

  // Fetch customers
  const fetchCustomers = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await customersService.getAll({ search });
      setCustomers(data.customers);
    } catch (err: any) {
      setError(err.message || 'Müşteriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchCustomers(query);
    }, 300),
    [fetchCustomers]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Create customer
  const onCreateSubmit = async (data: CreateCustomerFormData) => {
    setIsCreating(true);
    setError(null);

    try {
      const input: CustomerCreateInput = {
        name: data.name,
        slug: data.slug,
        domain: data.domain || undefined,
      };

      await customersService.create(input);
      setIsCreateModalOpen(false);
      reset();
      fetchCustomers();
    } catch (err: any) {
      setError(err.message || 'Müşteri oluşturulurken hata oluştu');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete customer
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" müşterisini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await customersService.delete(id);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Silme işlemi başarısız');
    }
  };

  // Copy API key
  const handleCopyApiKey = async (apiKey: string) => {
    const success = await copyToClipboard(apiKey);
    if (success) {
      alert('API Key kopyalandı!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
          <p className="mt-1 text-gray-500">Müşteri hesaplarını yönetin</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Yeni Müşteri
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="Müşteri ara..."
                value={searchQuery}
                onChange={handleSearch}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => fetchCustomers()}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Yenile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingOverlay />
          ) : error ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8">
              <p className="text-red-600">{error}</p>
              <Button onClick={() => fetchCustomers()}>Tekrar Dene</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableEmpty message="Müşteri bulunamadı" colSpan={5} />
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/customers/${customer.id}`}
                            className="font-medium text-gray-900 hover:text-primary-600"
                          >
                            {customer.name}
                          </Link>
                          {customer.domain && (
                            <p className="text-sm text-gray-500">{customer.domain}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                          {customer.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.isActive ? 'success' : 'default'}>
                          {customer.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(customer.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyApiKey(customer.apiKey)}
                            title="API Key Kopyala"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset();
        }}
        title="Yeni Müşteri Oluştur"
        size="md"
      >
        <form onSubmit={handleSubmit(onCreateSubmit)}>
          <div className="space-y-4">
            <Input
              {...register('name')}
              label="Müşteri Adı"
              placeholder="Elle Shoes"
              error={errors.name?.message}
            />
            <Input
              {...register('slug')}
              label="Slug"
              placeholder="elle-shoes"
              hint="URL'de kullanılacak benzersiz isim"
              error={errors.slug?.message}
            />
            <Input
              {...register('domain')}
              label="Domain (Opsiyonel)"
              placeholder="https://elleshoes.com"
              error={errors.domain?.message}
            />
          </div>

          <ModalFooter className="-mx-6 -mb-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                reset();
              }}
            >
              İptal
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Oluştur
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
