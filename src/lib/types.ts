import type { Timestamp } from 'firebase/firestore';

export interface Transaction {
  id?: string; // Firestore document ID, will be populated after fetch
  type: 'income' | 'expense';
  title: string;
  amount: number;
  categoryId: string;
  categoryName?: string; // Optional: Consider adding this during transaction creation for easier display
  date: string; // ISO date string e.g. "2024-07-28"
  description?: string;
  createdAt: Timestamp; // Firestore Timestamp
  userId: string;
}

export interface Category {
  id?: string; // Firestore document ID
  name: string;
  type: 'income' | 'expense';
  createdAt: Timestamp; // Firestore Timestamp
  userId: string;
}

// For chart data
export interface ChartDataPoint {
  name: string; // Category name
  value: number; // Total amount for this category
  fill: string; // Color for pie slice (e.g., "hsl(var(--chart-1))")
}
