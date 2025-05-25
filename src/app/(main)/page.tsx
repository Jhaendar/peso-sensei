
"use client";

import React from 'react';
import { MiniDashboard } from "@/components/dashboard/MiniDashboard";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction, Category, ChartDataPoint } from "@/lib/types";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseDistributionChart } from "@/components/charts/ExpenseDistributionChart"; // Import the chart
import type { ChartConfig } from "@/components/ui/chart"; // Import ChartConfig

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


function DashboardPageContent() {
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
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
      }
    });
    return { totalIncome, totalExpenses, currentBalance: totalIncome - totalExpenses };
  }, [transactions]);

  const { expenseChartData, expenseChartConfig } = React.useMemo((): {
    expenseChartData: ChartDataPoint[];
    expenseChartConfig: ChartConfig;
  } => {
    if (!transactions || !categories || isLoadingTransactions || isLoadingCategories) {
      return { expenseChartData: [], expenseChartConfig: {} };
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
    
    let finalChartData = Object.values(chartDataPointsMap).sort((a, b) => b.value - a.value);
    
    if (dashboardData.currentBalance > 0) {
        const balanceCategoryName = "Balance";
        const balanceColor = chartColorsHSL[colorIndex % chartColorsHSL.length] || "hsl(var(--foreground))"; // A fallback color
        finalChartData.push({ name: balanceCategoryName, value: dashboardData.currentBalance, fill: balanceColor });
        dynamicChartConfig[balanceCategoryName] = {
          label: balanceCategoryName,
          color: balanceColor,
        };
    } else if (finalChartData.length === 0 && dashboardData.totalIncome > 0 && dashboardData.totalExpenses === 0) {
        // Case: income exists, no expenses, so balance is the full income
        const balanceCategoryName = "Balance";
        const balanceColor = chartColorsHSL[0]; 
        finalChartData.push({ name: balanceCategoryName, value: dashboardData.totalIncome, fill: balanceColor });
        dynamicChartConfig[balanceCategoryName] = {
          label: balanceCategoryName,
          color: balanceColor,
        };
    }
    
    return { expenseChartData: finalChartData, expenseChartConfig: dynamicChartConfig };
  }, [transactions, categories, dashboardData.totalIncome, dashboardData.currentBalance, isLoadingCategories, isLoadingTransactions]);
  
  if ((isLoadingTransactions || isLoadingCategories) && user && !(transactionsError || categoriesError)) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[88px] w-full" /> {/* Approx height of MiniDashboard StatCard */}
          <Skeleton className="h-[88px] w-full" />
          <Skeleton className="h-[88px] w-full" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-4">
            <Skeleton className="h-[500px] w-full" /> {/* Approx height of TransactionForm Card */}
            <Skeleton className="h-[40px] w-full" /> {/* Approx height of Scan Receipt Button */}
          </div>
          <div className="lg:col-span-3 order-1 lg:order-2 hidden lg:block"> {/* Chart for desktop */}
            <Skeleton className="h-[400px] w-full" /> {/* Approx height of Chart Card */}
          </div>
        </div>
      </div>
    );
  }

  if (transactionsError || categoriesError) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-destructive">
            Error loading dashboard data: {transactionsError?.message || categoriesError?.message}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!user && !isLoadingTransactions && !isLoadingCategories) {
     return (
        <div className="space-y-6 text-center">
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
    <div className="space-y-6">
      <MiniDashboard 
        totalIncome={dashboardData.totalIncome}
        totalExpenses={dashboardData.totalExpenses}
        currentBalance={dashboardData.currentBalance}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-4"> {/* Form takes full width effectively */}
           <TransactionForm />
           <Button variant="outline" className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10 hover:text-primary" disabled>
            <ScanLine className="mr-2 h-5 w-5" />
            Scan Receipt with AI (Future)
          </Button>
        </div>
        <div className="lg:col-span-3 order-1 lg:order-2 hidden lg:block"> {/* Chart for desktop */}
           <ExpenseDistributionChart 
              data={expenseChartData} 
              config={expenseChartConfig}
              title={`Financial Overview for ${format(currentDate, "MMMM yyyy")}`}
            />
        </div>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardPageContent />
    </QueryClientProvider>
  );
}

    