'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ========================================
// Table Root
// ========================================

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-left text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

// ========================================
// Table Header
// ========================================

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead className={cn('border-b border-gray-200 bg-gray-50', className)} {...props}>
      {children}
    </thead>
  );
}

// ========================================
// Table Body
// ========================================

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody className={cn('divide-y divide-gray-200', className)} {...props}>
      {children}
    </tbody>
  );
}

// ========================================
// Table Row
// ========================================

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

export function TableRow({ className, children, ...props }: TableRowProps) {
  return (
    <tr
      className={cn('transition-colors hover:bg-gray-50', className)}
      {...props}
    >
      {children}
    </tr>
  );
}

// ========================================
// Table Head Cell
// ========================================

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

// ========================================
// Table Cell
// ========================================

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td className={cn('whitespace-nowrap px-4 py-3 text-gray-900', className)} {...props}>
      {children}
    </td>
  );
}

// ========================================
// Empty State
// ========================================

interface TableEmptyProps {
  message?: string;
  colSpan?: number;
}

export function TableEmpty({ message = 'Veri bulunamadı', colSpan = 5 }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-gray-500">
        {message}
      </td>
    </tr>
  );
}

export default Table;
