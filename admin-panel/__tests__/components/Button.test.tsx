/**
 * Button Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-600');
  });

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-100');
  });

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-gray-300');
  });

  it('applies danger variant', () => {
    render(<Button variant="danger">Delete</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600');
  });

  it('applies size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows loading spinner when isLoading', () => {
    render(<Button isLoading>Loading</Button>);

    // Check for the animate-spin class which is on the loader
    const button = screen.getByRole('button');
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders left icon', () => {
    render(<Button leftIcon={<span data-testid="left-icon">Icon</span>}>With Icon</Button>);

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Button rightIcon={<span data-testid="right-icon">Icon</span>}>With Icon</Button>);

    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('hides icons when loading', () => {
    render(
      <Button
        isLoading
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      >
        Loading
      </Button>
    );

    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards ref to button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('passes through native button props', () => {
    render(
      <Button type="submit" name="submit-btn" aria-label="Submit form">
        Submit
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('name', 'submit-btn');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
  });
});
