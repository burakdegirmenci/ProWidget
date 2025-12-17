'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';

// ========================================
// Validation Schema
// ========================================

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ========================================
// Component
// ========================================

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data);
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600">
            <Layers className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ProWidget</h1>
          <p className="mt-2 text-gray-600">Admin paneline giriş yapın</p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <Input
              {...register('email')}
              type="email"
              label="E-posta"
              placeholder="admin@example.com"
              error={errors.email?.message}
              leftIcon={<Mail className="h-5 w-5" />}
              autoComplete="email"
            />

            {/* Password */}
            <Input
              {...register('password')}
              type="password"
              label="Şifre"
              placeholder="••••••••"
              error={errors.password?.message}
              leftIcon={<Lock className="h-5 w-5" />}
              autoComplete="current-password"
            />

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Beni hatırla
              </label>
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Şifremi unuttum
              </a>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Giriş Yap
            </Button>
          </form>
        </div>

        {/* Security Note */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Güvenlik: Oturum bilgileriniz şifreli olarak saklanır ve 7 gün sonra otomatik olarak
          sonlandırılır.
        </p>
      </div>
    </div>
  );
}
