
import type { Timestamp } from 'firebase/firestore';

export interface Transaction {
  id?: string; // Firestore document ID, will be populated after fetch
  type: 'income' | 'expense';
  title: string;
  amount: number;
  categoryId: string;
  date: string; // ISO date string e.g. "2024-07-28"
  description?: string;
  createdAt: Date; // Ensure this is always a Date object after fetching
  userId: string;
}

export interface TransactionRow extends Omit<Transaction, 'createdAt' | 'date'> {
  categoryName?: string;
  createdAt: Date; // Ensure this is always a Date object for table consistency
  date: string; // Keep as string "yyyy-MM-dd" for filtering, cell will format
}


export interface Category {
  id?: string; // Firestore document ID
  name: string;
  type: 'income' | 'expense';
  createdAt: Date; // Ensure this is always a Date object
  userId: string;
}

// For chart data
export interface ChartDataPoint {
  name: string; // Category name or 'Balance'
  value: number; // Total amount for this category or balance amount
  fill: string; // Color for pie slice (e.g., "hsl(var(--chart-1))")
}

