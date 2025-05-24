
"use client";

import React from 'react';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListFilter, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction, Category, TransactionRow } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';

const fetchUserCategories = async (userId: string | undefined): Promise<Category[]> => {
  if (!userId || !db) return [];
  const categoriesCol = collection(db, "categories");
  const q = query(categoriesCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
    } as Category;
  }).sort((a, b) => a.name.localeCompare(b.name));
};

const fetchAllUserTransactions = async (userId: string | undefined): Promise<Transaction[]> => {
  if (!userId || !db) return [];
  const transactionsCol = collection(db, "transactions");
  const q = query(transactionsCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      date: data.date,
    } as Transaction;
  });
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; currency?: string; isLoading?: boolean }> = ({ title, value, icon, currency = "PHP", isLoading }) => {
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-5" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-1/2" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {currency} {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </CardContent>
    </Card>
  );
};


function TransactionsPageContent() {
  const { user } = useAuth();

  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>({
    queryKey: ['allUserCategories', user?.uid],
    queryFn: () => fetchUserCategories(user?.uid),
    enabled: !!user && !!db,
  });

  const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[], Error>({
    queryKey: ['allUserTransactions', user?.uid],
    queryFn: () => fetchAllUserTransactions(user?.uid),
    enabled: !!user && !!db,
  });

  const { totalIncome, totalExpenses, overallBalance } = React.useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpenses: 0, overallBalance: 0 };
    let income = 0;
    let expenses = 0;
    transactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expenses += t.amount;
      }
    });
    return { totalIncome: income, totalExpenses: expenses, overallBalance: income - expenses };
  }, [transactions]);

  const processedTableData = React.useMemo((): TransactionRow[] => {
    if (!transactions || !categories) return [];
    const categoriesMap = new Map(categories.map(cat => [cat.id, cat.name]));
    return transactions.map(t => ({
      ...t,
      categoryName: categoriesMap.get(t.categoryId) || "Uncategorized",
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, categories]);

  const isLoading = isLoadingCategories || isLoadingTransactions;
  const queryError = categoriesError || transactionsError;

  if (!user && !isLoading) {
    return <p className="text-center text-muted-foreground p-4">Please log in to view transactions.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Transactions</h1>
        <p className="text-muted-foreground">
          View, filter, and manage your financial activities.
        </p>
      </div>

      <section aria-labelledby="overall-summary-title" className="mb-8">
        <h2 id="overall-summary-title" className="sr-only">Overall Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Income"
            value={totalIncome}
            icon={<TrendingUp className="h-5 w-5 text-green-500" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Total Expenses"
            value={totalExpenses}
            icon={<TrendingDown className="h-5 w-5 text-red-500" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Overall Balance"
            value={overallBalance}
            icon={<Wallet className="h-5 w-5 text-primary" />}
            isLoading={isLoading}
          />
        </div>
      </section>

      {queryError && (
         <Card>
            <CardContent className="p-4">
                <p className="text-destructive">Error loading transaction data: {queryError.message}</p>
            </CardContent>
         </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <ListFilter className="mr-2 h-5 w-5" />
            All Transactions
          </CardTitle>
          <CardDescription>
            A detailed list of all your recorded financial activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable
            data={processedTableData}
            categories={categories || []}
            isLoading={isLoading}
            error={queryError}
          />
        </CardContent>
      </Card>
    </div>
  );
}

const queryClient = new QueryClient();

export default function TransactionsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <TransactionsPageContent />
    </QueryClientProvider>
  );
}
