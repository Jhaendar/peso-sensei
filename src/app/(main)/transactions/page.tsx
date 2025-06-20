"use client";

import React from 'react';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { DeleteTransactionDialog } from '@/components/transactions/DeleteTransactionDialog';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Removed DialogDescription
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListFilter, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction, Category, TransactionRow, TransactionFormData } from "@/lib/types";
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { queryKeys, invalidateTransactionQueries } from "@/lib/utils";

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

    const rawDate = data.date;
    let dateString: string;
    if (rawDate instanceof Timestamp) {
      dateString = format(rawDate.toDate(), "yyyy-MM-dd");
    } else if (typeof rawDate === 'string') {
      // Ensure it's in the correct format and handle it as a local date
      dateString = rawDate;
    } else if (rawDate instanceof Date) {
      dateString = format(rawDate, "yyyy-MM-dd");
    } else {
      console.warn("Unexpected type for date field:", rawDate, "for doc ID:", doc.id);
      dateString = format(new Date(), "yyyy-MM-dd"); // Fallback to current date
    }

    const rawCreatedAt = data.createdAt;
    const jsCreatedAt = rawCreatedAt instanceof Timestamp ? rawCreatedAt.toDate() : new Date(rawCreatedAt);

    const rawUpdatedAt = data.updatedAt;
    const jsUpdatedAt = rawUpdatedAt ? (rawUpdatedAt instanceof Timestamp ? rawUpdatedAt.toDate() : new Date(rawUpdatedAt)) : undefined;

    return {
      id: doc.id,
      title: data.title,
      amount: data.amount,
      categoryId: data.categoryId,
      type: data.type,
      description: data.description,
      userId: data.userId,
      date: dateString, // Keep as string to avoid timezone issues
      createdAt: jsCreatedAt,
      updatedAt: jsUpdatedAt,
    } as Transaction;
  });
};

const deleteTransaction = async (transactionId: string): Promise<void> => {
  if (!db) throw new Error("Firestore database is not initialized.");
  if (!transactionId) throw new Error("Transaction ID is required for deletion.");
  const transactionRef = doc(db, "transactions", transactionId);
  await deleteDoc(transactionRef);
};

// Firestore update function for a transaction
const updateTransaction = async (transactionId: string, data: TransactionFormData, userId: string): Promise<void> => {
  if (!db) throw new Error("Firestore database is not initialized.");
  if (!transactionId) throw new Error("Transaction ID is required for update.");
  const transactionRef = doc(db, "transactions", transactionId);
  
  // Ensure date is properly formatted as string for consistent Firestore queries
  const dateString = data.date instanceof Date ? format(data.date, "yyyy-MM-dd") : data.date;
  
  await updateDoc(transactionRef, {
    ...data,
    date: dateString, // Store as string for consistent querying
    amount: Number(data.amount), // Ensure amount is a number
    updatedAt: serverTimestamp(),
    userId, // ensure userId is part of the update if needed for rules, though often not directly updated
  });
};

// Function to create a new transaction in Firestore
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
  const { toast } = useToast();
  const tanstackQueryClient = useTanstackQueryClient();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = React.useState<string | null>(null);

  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<TransactionRow | null>(null);

  // State for create dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // Use standardized query keys
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>({
    queryKey: queryKeys.categories.all(user?.uid || ''),
    queryFn: () => fetchUserCategories(user?.uid),
    enabled: !!user && !!db,
  });

  const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[], Error>({
    queryKey: queryKeys.transactions.all(user?.uid || ''),
    queryFn: () => fetchAllUserTransactions(user?.uid),
    enabled: !!user && !!db,
  });

  const updateTransactionMutation = useMutation<
    void,
    Error,
    { transactionId: string; data: TransactionFormData; userId: string }
  >({
    mutationFn: ({ transactionId, data, userId }) => updateTransaction(transactionId, data, userId),
    onSuccess: (_data, variables) => {
      toast({ title: "Success", description: "Transaction updated successfully." });
      const transactionDate = variables.data.date instanceof Date ? variables.data.date : new Date(variables.data.date);
      const transactionMonthKey = format(transactionDate, "yyyy-MM");

      // Use standardized cache invalidation
      invalidateTransactionQueries(tanstackQueryClient, user?.uid || '', transactionMonthKey);

      setIsEditDialogOpen(false);
      setEditingTransaction(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to update transaction: ${error.message}`, variant: "destructive" });
    },
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

      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to create transaction: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteTransactionMutation = useMutation<void, Error, { transactionId: string, transactionDate: Date | string }>({
    mutationFn: ({ transactionId }) => deleteTransaction(transactionId),
    onSuccess: (_data, variables) => {
      toast({ title: "Success", description: "Transaction deleted successfully." });
      const transactionDate = variables.transactionDate instanceof Date ? variables.transactionDate : new Date(variables.transactionDate);
      const transactionMonthKey = format(transactionDate, "yyyy-MM");

      // Use standardized cache invalidation
      invalidateTransactionQueries(tanstackQueryClient, user?.uid || '', transactionMonthKey);

      setIsDeleteDialogOpen(false);
      setTransactionToDeleteId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to delete transaction: ${error.message}`, variant: "destructive" });
      setIsDeleteDialogOpen(false);
      setTransactionToDeleteId(null);
    },
  });

  const handleOpenDeleteDialog = (transactionId: string) => {
    setTransactionToDeleteId(transactionId);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setTransactionToDeleteId(null);
  };

  const handleConfirmDelete = () => {
    if (transactionToDeleteId) {
      // Find the transaction to get its date for more precise cache invalidation
      const transactionToDelete = transactions?.find(t => t.id === transactionToDeleteId);
      if (transactionToDelete && transactionToDelete.date) {
        deleteTransactionMutation.mutate({ transactionId: transactionToDeleteId, transactionDate: transactionToDelete.date });
      } else {
        // Fallback if date not found, though less ideal (or handle error)
        // For simplicity, we'll proceed but log a warning or rely on broader invalidation if date is missing
        console.warn("Could not find transaction date for precise invalidation on delete.");
        // Perform a broader invalidation if specific month cannot be determined
        deleteTransactionMutation.mutate({ transactionId: transactionToDeleteId, transactionDate: new Date() });
      }
    }
  };

  // Handlers for edit dialog
  const handleOpenEditDialog = (transaction: TransactionRow) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  // const handleCloseEditDialog = () => { // This function is unused
  //   setIsEditDialogOpen(false);
  //   setEditingTransaction(null);
  // };

  const handleUpdateTransaction = async (data: TransactionFormData) => {
    if (!editingTransaction || !editingTransaction.id || !user?.uid) {
      toast({ title: "Error", description: "Cannot update transaction. Missing data.", variant: "destructive" });
      return;
    }
    await updateTransactionMutation.mutateAsync({
      transactionId: editingTransaction.id,
      data,
      userId: user.uid
    });
  };

  // Handler for create transaction
  const handleCreateTransaction = async (data: TransactionFormData) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "Cannot create transaction. User not found.", variant: "destructive" });
      return;
    }
    await createTransactionMutation.mutateAsync({ data, userId: user.uid });
  };

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
      createdAt: t.createdAt,
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, categories]);

  const isLoading = isLoadingCategories || isLoadingTransactions;
  const queryError = categoriesError || transactionsError;

  if (!user && !isLoading) {
    return <p className="text-center text-muted-foreground p-4">Please log in to view transactions.</p>;
  }

  const tableMeta = {
    handleOpenDeleteDialog,
    handleOpenEditDialog, // Pass edit handler
    deleteTransactionMutation: {
      isPending: deleteTransactionMutation.isPending,
    },
  };

  return (
    <>
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
              meta={tableMeta}
            />
          </CardContent>
        </Card>
      </div>

      <DeleteTransactionDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteTransactionMutation.isPending}
      />

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingTransaction(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm
              onSubmit={handleUpdateTransaction}
              categories={categories || []}
              userId={user?.uid || ""}
              initialData={editingTransaction}
              isSubmitting={updateTransactionMutation.isPending}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingTransaction(null);
              }}
              isEditMode={true} // Add this line
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Create Transaction Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={handleCreateTransaction}
            categories={categories || []}
            userId={user?.uid || ""}
            isSubmitting={createTransactionMutation.isPending}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TransactionsPage() {
  return <TransactionsPageContent />;
}
