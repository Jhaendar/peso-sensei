
"use client";

import React from 'react';
import { ExpenseDistributionChart } from "@/components/charts/ExpenseDistributionChart";
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction, Category, ChartDataPoint } from "@/lib/types";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartConfig } from "@/components/ui/chart";

const fetchUserCategories = async (userId: string): Promise<Category[]> => {
  if (!userId || !db) return [];
  const categoriesCol = collection(db, "categories");
  const q = query(categoriesCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const createdAtRaw = data.createdAt;
    return { 
      id: doc.id, 
      ...data, 
      createdAt: createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : new Date(createdAtRaw) 
    } as Category;
  });
};

const fetchMonthlyTransactions = async (userId: string, currentDate: Date): Promise<Transaction[]> => {
  if (!userId || !db) return [];
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
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const createdAtRaw = data.createdAt;
    return { 
      id: doc.id, 
      ...doc.data(), 
      createdAt: createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : new Date(createdAtRaw) 
    } as Transaction;
  });
};

const chartColorsHSL = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))", 
  "hsl(var(--accent))", 
];

function ReportsPageContent() {
  const { user } = useAuth();
  const currentDate = new Date(); 
  const currentMonthYearKey = format(currentDate, "yyyy-MM");

  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>({
    queryKey: ['categories', user?.uid],
    queryFn: () => fetchUserCategories(user!.uid),
    enabled: !!user && !!db,
  });

  const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[], Error>({
    queryKey: ['monthlyTransactions', user?.uid, currentMonthYearKey],
    queryFn: () => fetchMonthlyTransactions(user!.uid, currentDate),
    enabled: !!user && !!db,
  });

  const dashboardData = React.useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpenses: 0, currentBalance: 0 };
    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpenses += t.amount;
    });
    return { totalIncome, totalExpenses, currentBalance: totalIncome - totalExpenses };
  }, [transactions]);

  const { overviewChartData, overviewChartConfig } = React.useMemo((): {
    overviewChartData: ChartDataPoint[];
    overviewChartConfig: ChartConfig;
  } => {
    if (!transactions || !categories || isLoadingTransactions || isLoadingCategories) {
      return { overviewChartData: [], overviewChartConfig: {} };
    }
  
    const chartDataPointsMap: Record<string, ChartDataPoint> = {};
    const dynamicChartConfig: ChartConfig = {};
    let colorIndex = 0;
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
  
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    expenseTransactions.forEach(t => {
      const categoryName = categoryMap.get(t.categoryId) || 'Uncategorized Expenses';
      if (!chartDataPointsMap[categoryName]) {
        const color = chartColorsHSL[colorIndex % chartColorsHSL.length];
        chartDataPointsMap[categoryName] = { name: categoryName, value: 0, fill: color };
        dynamicChartConfig[categoryName] = { label: categoryName, color: color };
        colorIndex++;
      }
      chartDataPointsMap[categoryName].value += t.amount;
    });
  
    let chartDataPoints = Object.values(chartDataPointsMap).sort((a, b) => b.value - a.value);
    
    if (dashboardData.currentBalance > 0 && dashboardData.totalIncome > 0) {
      const balanceCategoryName = "Balance";
      const balanceColor = chartColorsHSL[colorIndex % chartColorsHSL.length] || "hsl(var(--foreground))"; // A fallback color
      chartDataPoints.push({ name: balanceCategoryName, value: dashboardData.currentBalance, fill: balanceColor });
      dynamicChartConfig[balanceCategoryName] = {
        label: balanceCategoryName,
        color: balanceColor,
      };
    } else if (chartDataPoints.length === 0 && dashboardData.totalIncome > 0 && dashboardData.totalExpenses === 0) {
        // Case: income exists, no expenses, so balance is the full income
        const balanceCategoryName = "Balance";
        const balanceColor = chartColorsHSL[0]; 
        chartDataPoints.push({ name: balanceCategoryName, value: dashboardData.totalIncome, fill: balanceColor });
        dynamicChartConfig[balanceCategoryName] = {
          label: balanceCategoryName,
          color: balanceColor,
        };
    }
    
    return { overviewChartData: chartDataPoints, overviewChartConfig: dynamicChartConfig };
  }, [transactions, categories, dashboardData.totalIncome, dashboardData.currentBalance, isLoadingCategories, isLoadingTransactions]);
  
  if (isLoadingCategories || (user && isLoadingTransactions && !transactions && !categoriesError)) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary mb-8">Financial Reports</h1>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (categoriesError || transactionsError) {
    return (
      <Card>
        <CardHeader>
            <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-destructive">
            Error loading report data: {categoriesError?.message || transactionsError?.message}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!user && !isLoadingCategories && !isLoadingTransactions) {
     return (
        <div className="space-y-6 text-center">
            <p>Please log in to view reports.</p>
        </div>
     )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary mb-8">Financial Reports</h1>
      <div className="grid grid-cols-1 gap-6">
        <ExpenseDistributionChart 
            data={overviewChartData} 
            config={overviewChartConfig} 
            title={`Financial Overview for ${format(currentDate, "MMMM yyyy")}`} 
        />
        {/* You can add more charts or report elements here in the future */}
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

export default function ReportsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReportsPageContent />
    </QueryClientProvider>
  );
}
