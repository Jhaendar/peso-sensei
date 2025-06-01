import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { QueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Standardized query keys to ensure consistent invalidation
export const queryKeys = {
  transactions: {
    all: (userId: string) => ["allUserTransactions", userId] as const,
    monthly: (userId: string, monthKey: string) => [
      "monthlyTransactions",
      userId,
      monthKey,
    ] as const,
  },
  categories: {
    all: (userId: string) => ["categories", userId] as const,
    byType: (userId: string, type: string) => [
      "categories",
      userId,
      type,
    ] as const,
  },
} as const;

// Standardized cache invalidation helper
export const invalidateTransactionQueries = (
  queryClient: QueryClient,
  userId: string,
  transactionMonthKey?: string
) => {
  const currentMonthKey = format(new Date(), "yyyy-MM");

  console.log(
    "Invalidating queries for userId:",
    userId,
    "transactionMonth:",
    transactionMonthKey
  );

  // Always invalidate all transactions and categories
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all(userId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.all(userId) });

  // Invalidate specific month if provided
  if (transactionMonthKey) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.transactions.monthly(userId, transactionMonthKey),
    });
  }

  // Always invalidate current month for dashboard
  queryClient.invalidateQueries({
    queryKey: queryKeys.transactions.monthly(userId, currentMonthKey),
  });

  // If transaction is from different month, also invalidate that month
  if (transactionMonthKey && transactionMonthKey !== currentMonthKey) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.transactions.monthly(userId, transactionMonthKey),
    });
  }
};
