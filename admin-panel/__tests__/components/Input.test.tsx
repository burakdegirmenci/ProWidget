/**
 * Input Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />);

    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Email" placeholder="Enter email" />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(<Input error="This field is required" />);

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error styling when error is provided', () => {
    render(<Input error="Error" data-testid="error-input" />);

    const input = screen.getByTestId('error-input');
    expect(input).toHaveClass('border-red-500');
  });

  it('renders hint text when provided', () => {
    render(<Input hint="Enter your email address" />);

    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('shows error instead of hint when both are provided', () => {
    render(<Input hint="Hint text" error="Error text" />);

    expect(screen.getByText('Error text')).toBeInTheDocument();
    expect(screen.queryByText('Hint text')).not.toBeInTheDocument();
  });

  it('renders left icon', () => {
    render(<Input leftIcon={<span data-testid="left-icon">Icon</span>} />);

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Input rightIcon={<span data-testid="right-icon">Icon</span>} />);

    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies padding for left icon', () => {
    render(<Input leftIcon={<span>Icon</span>} data-testid="icon-input" />);

    const input = screen.getByTestId('icon-input');
    expect(input).toHaveClass('pl-10');
  });

  it('applies padding for right icon', () => {
    render(<Input rightIcon={<span>Icon</span>} data-testid="icon-input" />);

    const input = screen.getByTestId('icon-input');
    expect(input).toHaveClass('pr-10');
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Enter text" />);

    const input = screen.getByPlaceholderText('Enter text');
    fireEvent.change(input, { target: { value: 'test value' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
  });

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled" />);

    const input = screen.getByPlaceholderText('Disabled');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="custom-input" />);

    expect(screen.getByTestId('custom-input')).toHaveClass('custom-class');
  });

  it('forwards ref to input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Ref test" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('uses provided id or generates one', () => {
    const { rerender } = render(<Input id="custom-id" label="Custom" />);
    expect(screen.getByLabelText('Custom')).toHaveAttribute('id', 'custom-id');

    rerender(<Input label="Auto ID" />);
    const input = screen.getByLabelText('Auto ID');
    expect(input.id).toMatch(/^input-/);
  });

  it('supports autoComplete attribute', () => {
    render(<Input autoComplete="email" data-testid="autocomplete-input" />);

    expect(screen.getByTestId('autocomplete-input')).toHaveAttribute('autoComplete', 'email');
  });

  it('supports required attribute', () => {
    render(<Input required data-testid="required-input" />);

    expect(screen.getByTestId('required-input')).toBeRequired();
  });
});
