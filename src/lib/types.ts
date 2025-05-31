
import type { Timestamp } from 'firebase/firestore';
import * as z from "zod"; // Import Zod

export interface Transaction {
  id?: string; // Firestore document ID, will be populated after fetch
  type: 'income' | 'expense';
  title: string;
  amount: number;
  categoryId: string;
  date: string; // ISO date string e.g. "2024-07-28"
  description?: string;
  createdAt: Date; // Ensure this is always a Date object after fetching
  updatedAt?: Date; // For tracking updates
  userId: string;
}

export interface TransactionRow extends Omit<Transaction, 'createdAt' | 'date'> {
  categoryName?: string;
  createdAt: Date; 
  date: string; // Keep as string "yyyy-MM-dd"
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

// Zod schema for transaction form data, also used for type inference
export const transactionFormSchema = z.object({
  type: z.enum(["income", "expense"]),
  date: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') return new Date(val); // Ensure it becomes a Date object for form use
    return val;
  }),
  title: z.string().min(1, "Title is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  categoryId: z.string().min(1, "Category is required."),
  description: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;
