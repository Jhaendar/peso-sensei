"use client";

import React from 'react';
import { MiniDashboard } from "@/components/dashboard/MiniDashboard";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction, Category, ChartDataPoint, TransactionFormData } from "@/lib/types";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseDistributionChart } from "@/components/charts/ExpenseDistributionChart";
import type { ChartConfig } from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import { queryKeys, invalidateTransactionQueries } from "@/lib/utils";

const fetchUserCategories = async (userId: string | undefined): Promise<Category[]> => {
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

const fetchMonthlyTransactions = async (userId: string | undefined, currentDate: Date): Promise<Transaction[]> => {
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
    
    const rawDate = data.date;
    let dateString: string;
    if (rawDate instanceof Timestamp) {
      dateString = format(rawDate.toDate(), "yyyy-MM-dd");
    } else if (typeof rawDate === 'string') {
      // Keep as string to avoid timezone issues
      dateString = rawDate;
    } else if (rawDate instanceof Date) {
      dateString = format(rawDate, "yyyy-MM-dd");
    } else {
      console.warn("Unexpected type for date field:", rawDate, "for doc ID:", doc.id);
      dateString = format(new Date(), "yyyy-MM-dd"); // Fallback to current date
    }
    
    const createdAtRaw = data.createdAt;
    return {
      id: doc.id,
      ...data,
      date: dateString, // Keep as string to avoid timezone issues
      createdAt: createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : new Date(createdAtRaw)
    } as Transaction;
  });
};

const chartColorsHSL = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  // Note: chart-5 is now reserved for Balance
];
const balanceSliceColor = "hsl(var(--chart-5))"; // Specific green color for balance

// Function to create a new transaction in Firestore (similar to the one in transactions/page.tsx)
const createTransaction = async (data: TransactionFormData, userId: string): Promise<void> => {
  if (!db) throw new Error("Firestore database is not initialized.");
  if (!userId) throw new Error("User ID is required to create a transaction.");
  const transactionsCol = collection(db, "transactions");
  
  // Ensure date is properly formatted as string for consistent Firestore queries
  const dateString = data.date instanceof Date ? format(data.date, "yyyy-MM-dd") : data.date;
  
  await addDoc(transactionsCol, {
    ...data,
    date: dateString, // Store as string for consistent querying
    amount: Number(data.amount), // Ensure amount is a number
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

function DashboardPageContent() {
  const { user } = useAuth();
  const currentDate = new Date();
  const currentMonthYearKey = format(currentDate, "yyyy-MM");
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();

  // Use standardized query keys
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>({
    queryKey: queryKeys.categories.all(user?.uid || ''),
    queryFn: () => fetchUserCategories(user?.uid),
    enabled: !!user && !!db,
  });

  const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[], Error>({
    queryKey: queryKeys.transactions.monthly(user?.uid || '', currentMonthYearKey),
    queryFn: () => fetchMonthlyTransactions(user!.uid, currentDate),
    enabled: !!user && !!db,
  });

  const createTransactionMutation = useMutation<
    void,
    Error,
    { data: TransactionFormData; userId: string }
  >({
    mutationFn: ({ data, userId }) => createTransaction(data, userId),
    onSuccess: (_data, variables) => {
      toast({ title: "Success", description: "Transaction created successfully." });
      const transactionDate = variables.data.date instanceof Date ? variables.data.date : new Date(variables.data.date);
      const transactionMonthKey = format(transactionDate, "yyyy-MM");
      
      // Use standardized cache invalidation
      invalidateTransactionQueries(tanstackQueryClient, user?.uid || '', transactionMonthKey);
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to create transaction: ${error.message}`, variant: "destructive" });
    },
  });

  const handleCreateTransaction = async (data: TransactionFormData) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "Cannot create transaction. User not found.", variant: "destructive" });
      return;
    }
    await createTransactionMutation.mutateAsync({ data, userId: user.uid });
  };

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

    const finalChartData = Object.values(chartDataPointsMap).sort((a, b) => b.value - a.value);

    if (dashboardData.currentBalance > 0 && dashboardData.totalIncome > 0) {
      const balanceCategoryName = "Balance";
      finalChartData.push({ name: balanceCategoryName, value: dashboardData.currentBalance, fill: balanceSliceColor });
      dynamicChartConfig[balanceCategoryName] = {
        label: balanceCategoryName,
        color: balanceSliceColor,
      };
    } else if (finalChartData.length === 0 && dashboardData.totalIncome > 0 && dashboardData.totalExpenses === 0) {
      // Case: income exists, no expenses, so balance is the full income
      const balanceCategoryName = "Balance";
      finalChartData.push({ name: balanceCategoryName, value: dashboardData.totalIncome, fill: balanceSliceColor });
      dynamicChartConfig[balanceCategoryName] = {
        label: balanceCategoryName,
        color: balanceSliceColor,
      };
    }

    return { expenseChartData: finalChartData, expenseChartConfig: dynamicChartConfig };
  }, [transactions, categories, dashboardData.totalIncome, dashboardData.currentBalance, dashboardData.totalExpenses, isLoadingCategories, isLoadingTransactions]);


  if ((isLoadingTransactions || isLoadingCategories) && user && !(transactionsError || categoriesError)) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[72px] w-full" /> {/* Adjusted height of MiniDashboard StatCard */}
          <Skeleton className="h-[72px] w-full" />
          <Skeleton className="h-[72px] w-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-4">
            <Skeleton className="h-[500px] w-full" /> {/* Approx height of TransactionForm Card */}
          </div>
          <div className="lg:col-span-3 order-1 lg:order-2 hidden lg:block"> {/* Chart for desktop */}
            <Skeleton className="h-[350px] w-full" /> {/* Approx height of Chart Card */}
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
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-4"> {/* Form takes more space */}
          <TransactionForm
            onSubmit={handleCreateTransaction}
            categories={categories || []}
            userId={user?.uid || ""}
            isSubmitting={createTransactionMutation.isPending}
            // No initialData, so it's in "create" mode
            // No onCancel needed here as it's not in a dialog and form has own reset
          />
          {/* The old Scan Receipt button that was here is now removed */}
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

export default function DashboardPage() {
  return <DashboardPageContent />;
}

