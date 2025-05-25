
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
import type { Transaction, Category } from "@/lib/types";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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

function DashboardPageContent() {
  const { user } = useAuth();
  const currentDate = new Date(); 
  const currentMonthYearKey = format(currentDate, "yyyy-MM");

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
  
  if (isLoadingTransactions && user && !transactionsError) {
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
          {/* Chart is removed from here */}
        </div>
      </div>
    );
  }

  if (transactionsError) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-destructive">
            Error loading dashboard data: {transactionsError?.message}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!user && !isLoadingTransactions) {
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"> {/* Adjusted to 2 cols for form only */}
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-4"> {/* Form takes full width effectively */}
           <TransactionForm />
           <Button variant="outline" className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10 hover:text-primary" disabled>
            <ScanLine className="mr-2 h-5 w-5" />
            Scan Receipt with AI (Future)
          </Button>
        </div>
         {/* Chart is removed from here */}
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
