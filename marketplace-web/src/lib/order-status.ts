import { OrderStatus } from '@/lib/types';

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; badgeClass: string; selectClass: string }> = {
  PLACED: {
    label: 'Placed',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300',
    selectClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300',
  },
  CONFIRMED: {
    label: 'Confirmed',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300',
    selectClass:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-300',
  },
  SHIPPED: {
    label: 'Shipped',
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/25 dark:text-indigo-300',
    selectClass:
      'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-900/20 dark:text-indigo-300',
  },
  DELIVERED: {
    label: 'Delivered',
    badgeClass: 'bg-green-50 text-green-700 dark:bg-green-900/25 dark:text-green-300',
    selectClass:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-800/60 dark:bg-green-900/20 dark:text-green-300',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeClass: 'bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-300',
    selectClass:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300',
  },
};
