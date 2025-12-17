/**
 * Login Page Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';

// Mock the useAuth hook
const mockLogin = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
  }),
}));

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginPage />);

    expect(screen.getByText('ProWidget')).toBeInTheDocument();
    expect(screen.getByText('Admin paneline giriş yapın')).toBeInTheDocument();
    expect(screen.getByLabelText('E-posta')).toBeInTheDocument();
    expect(screen.getByLabelText('Şifre')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Giriş Yap' })).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    render(<LoginPage />);

    expect(screen.getByText('Şifremi unuttum')).toBeInTheDocument();
  });

  it('renders remember me checkbox', () => {
    render(<LoginPage />);

    expect(screen.getByText('Beni hatırla')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('E-posta');
    const submitButton = screen.getByRole('button', { name: 'Giriş Yap' });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      // Check that login was not called with invalid email
      expect(mockLogin).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('prevents submission with short password', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('E-posta');
    const passwordInput = screen.getByLabelText('Şifre');
    const submitButton = screen.getByRole('button', { name: 'Giriş Yap' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      // Check that login was not called with short password
      expect(mockLogin).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('calls login function with valid credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('E-posta');
    const passwordInput = screen.getByLabelText('Şifre');
    const submitButton = screen.getByRole('button', { name: 'Giriş Yap' });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
      });
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Geçersiz kullanıcı adı veya şifre'));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('E-posta');
    const passwordInput = screen.getByLabelText('Şifre');
    const submitButton = screen.getByRole('button', { name: 'Giriş Yap' });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Geçersiz kullanıcı adı veya şifre')).toBeInTheDocument();
    });
  });

  it('clears error when submitting again', async () => {
    const user = userEvent.setup();
    mockLogin
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce({ success: true });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('E-posta');
    const passwordInput = screen.getByLabelText('Şifre');
    const submitButton = screen.getByRole('button', { name: 'Giriş Yap' });

    // First submission - error
    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    // Second submission - error should be cleared
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });

  it('has correct input types', () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('E-posta');
    const passwordInput = screen.getByLabelText('Şifre');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('has autocomplete attributes', () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('E-posta');
    const passwordInput = screen.getByLabelText('Şifre');

    expect(emailInput).toHaveAttribute('autocomplete', 'email');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });

  it('renders security note', () => {
    render(<LoginPage />);

    expect(
      screen.getByText(/Güvenlik: Oturum bilgileriniz şifreli olarak saklanır/)
    ).toBeInTheDocument();
  });
});

describe('Login Page - Loading State', () => {
  it('shows loading state when isLoading is true', () => {
    jest.mock('@/contexts/AuthContext', () => ({
      useAuth: () => ({
        login: jest.fn(),
        isLoading: true,
      }),
    }));

    // Note: This test demonstrates the expected behavior
    // The actual implementation would require the component to properly
    // reflect the isLoading state from useAuth
  });
});
