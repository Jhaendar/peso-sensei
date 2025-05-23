export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  categoryName?: string; // Optional, for display convenience
  date: string; // ISO date string e.g. "2024-07-28"
  description?: string;
  createdAt: Date;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  createdAt: Date;
  userId: string;
}

// For chart data
export interface ChartDataPoint {
  name: string; // Category name
  value: number; // Total amount for this category
  fill?: string; // Optional color for pie slice
}
