
"use client";

import React from 'react';
import { MiniDashboard } from "@/components/dashboard/MiniDashboard";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { ExpenseDistributionChart } from "@/components/charts/ExpenseDistributionChart";
import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";
import type { Metadata } from 'next';
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction, Category, ChartDataPoint } from "@/lib/types";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartConfig } from "@/components/ui/chart";

// export const metadata: Metadata = { // Cannot use metadata export in a client component
//   title: 'Dashboard - Peso Sensei',
// };

const fetchUserCategories = async (userId: string): Promise<Category[]> => {
  if (!userId) return [];
  const categoriesCol = collection(db, "categories");
  const q = query(categoriesCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

const fetchMonthlyTransactions = async (userId: string, currentDate: Date): Promise<Transaction[]> => {
  if (!userId) return [];
  const transactionsCol = collection(db, "transactions");
  
  const monthStart = format(startOfMonth(currentDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(currentDate), "yyyy-MM-dd");

  const q = query(
    transactionsCol,
    where("userId", "==", userId),
    where("date", ">=", monthStart),
    where("date", "<=", monthEnd)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

const chartColorsHSL = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function DashboardPageContent() {
  const { user } = useAuth();
  const currentDate = new Date();
  const currentMonthYearKey = format(currentDate, "yyyy-MM");

  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>(
    ['categories', user?.uid],
    () => fetchUserCategories(user!.uid),
    { enabled: !!user }
  );

  const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[], Error>(
    ['monthlyTransactions', user?.uid, currentMonthYearKey],
    () => fetchMonthlyTransactions(user!.uid, currentDate),
    { enabled: !!user }
  );

  const categoriesMap = React.useMemo(() => {
    const map = new Map<string, Category>();
    categories?.forEach(cat => map.set(cat.id!, cat));
    return map;
  }, [categories]);

  const dashboardData = React.useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpenses: 0, currentBalance: 0 };
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
      }
    });
    return { totalIncome, totalExpenses, currentBalance: totalIncome - totalExpenses };
  }, [transactions]);

  const expenseChartData = React.useMemo((): ChartDataPoint[] => {
    if (!transactions || !categoriesMap.size) return [];
    
    const expensesByCategory: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      expensesByCategory[t.categoryId] = (expensesByCategory[t.categoryId] || 0) + t.amount;
    });

    return Object.entries(expensesByCategory)
      .map(([categoryId, total], index) => {
        const category = categoriesMap.get(categoryId);
        return {
          name: category ? category.name : `Unknown: ${categoryId.slice(0,6)}`,
          value: total,
          fill: chartColorsHSL[index % chartColorsHSL.length],
        };
      })
      .sort((a, b) => b.value - a.value); // Sort for consistent color assignment if desired
  }, [transactions, categoriesMap]);

  const dynamicChartConfig = React.useMemo((): ChartConfig => {
    const config: ChartConfig = {};
    expenseChartData.forEach(item => {
      config[item.name] = {
        label: item.name,
        color: item.fill, 
      };
    });
    return config;
  }, [expenseChartData]);
  
  if (isLoadingCategories || (user && isLoadingTransactions && !transactions)) {
    return (
      <div className="space-y-8">
        {/* Skeleton for MiniDashboard */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[100px] w-full" />
        </div>
        <div className="block md:hidden">
          <Skeleton className="h-[120px] w-full" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Skeleton className="h-[500px] w-full" /> {/* Skeleton for TransactionForm area */}
          </div>
          <div className="hidden lg:block lg:col-span-2 order-1 lg:order-2">
            <Skeleton className="h-[400px] w-full" /> {/* Skeleton for Chart */}
          </div>
        </div>
      </div>
    );
  }

  if (categoriesError || transactionsError) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-destructive">
            Error loading dashboard data: {categoriesError?.message || transactionsError?.message}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!user && !isLoadingCategories && !isLoadingTransactions) {
     // This case might occur if auth bypass is imperfect or user logs out.
     // For now, render a simplified state or a message.
     return (
        <div className="space-y-8 text-center">
            <p>Please log in to view your dashboard.</p>
             <MiniDashboard 
              totalIncome={0}
              totalExpenses={0}
              currentBalance={0}
            />
        </div>
     )
  }


  return (
    <div className="space-y-8">
      <MiniDashboard 
        totalIncome={dashboardData.totalIncome}
        totalExpenses={dashboardData.totalExpenses}
        currentBalance={dashboardData.currentBalance}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 order-2 lg:order-1">
           <TransactionForm />
           <Button variant="outline" className="w-full mt-6 border-dashed border-primary text-primary hover:bg-primary/10 hover:text-primary" disabled>
            <ScanLine className="mr-2 h-5 w-5" />
            Scan Receipt with AI (Future)
          </Button>
        </div>
        <div className="hidden lg:block lg:col-span-2 order-1 lg:order-2">
          {expenseChartData.length > 0 ? (
            <ExpenseDistributionChart 
              data={expenseChartData} 
              config={dynamicChartConfig} 
              title={`Expenses for ${format(currentDate, "MMMM yyyy")}`} 
            />
          ) : (
            <Card>
              <CardContent className="p-6 h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">No expense data for {format(currentDate, "MMMM yyyy")} to display in chart.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Create a new QueryClient instance
const queryClient = new QueryClient();

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardPageContent />
    </QueryClientProvider>
  );
}
