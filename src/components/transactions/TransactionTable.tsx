
"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/auth-provider";
import type { Transaction, Category } from "@/lib/types";
import { columns, type TransactionRow } from "./TransactionTableColumns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";

const fetchUserCategories = async (userId: string): Promise<Category[]> => {
  if (!userId) return [];
  if (!db) {
    console.error("Firestore DB instance is not available for fetchUserCategories.");
    // Potentially throw an error or return a specific state if db is critical here
    return [];
  }
  const categoriesCol = collection(db, "categories");
  const q = query(categoriesCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

const fetchAllUserTransactions = async (userId: string): Promise<Transaction[]> => {
  if (!userId) return [];
  if (!db) {
    console.error("Firestore DB instance is not available for fetchAllUserTransactions.");
    return [];
  }
  const transactionsCol = collection(db, "transactions");
  const q = query(transactionsCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  // Ensure createdAt is converted if it's a Firestore Timestamp
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate() : new Date(data.createdAt),
    } as Transaction;
  });
};


function TransactionTableContent() {
  const { user } = useAuth();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>({
    queryKey: ['allUserCategories', user?.uid],
    queryFn: () => fetchUserCategories(user!.uid),
    enabled: !!user && !!db, // Also check if db is available
  });

  const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[], Error>({
    queryKey: ['allUserTransactions', user?.uid],
    queryFn: () => fetchAllUserTransactions(user!.uid),
    enabled: !!user && !!db, // Also check if db is available
  });

  const processedData = React.useMemo((): TransactionRow[] => {
    if (!transactions || !categories) return [];
    const categoriesMap = new Map(categories.map(cat => [cat.id, cat.name]));
    return transactions.map(t => ({
      ...t,
      categoryName: categoriesMap.get(t.categoryId) || "Uncategorized",
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Default sort by date descending
  }, [transactions, categories]);
  
  const table = useReactTable({
    data: processedData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (!db && user) { // Check if db is not available after initial app load and user is present
    return (
      <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
        <p className="font-semibold">Firestore Connection Error</p>
        <p>The application could not connect to the database. Please ensure Firebase is configured correctly and check the console for more details.</p>
      </div>
    )
  }
  
  if (categoriesError || transactionsError) {
    return (
        <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
          <p className="font-semibold">Error loading transaction data:</p>
          <pre className="text-xs whitespace-pre-wrap">
            {categoriesError?.message || transactionsError?.message}
            {categoriesError?.stack || transactionsError?.stack}
          </pre>
        </div>
    );
  }

  if (isLoadingCategories || (user && isLoadingTransactions && !transactions)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center py-4">
          <Skeleton className="h-10 w-full max-w-sm" /> 
          <Skeleton className="ml-auto h-10 w-[120px]" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {Array(6).fill(null).map((_, idx) => (
                <TableHead key={idx}><Skeleton className="h-5 w-20" /></TableHead>
              ))}
            </TableHeader>
            <TableBody>
              {Array(5).fill(null).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array(6).fill(null).map((_, cellIndex) => (
                    <TableCell key={cellIndex}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
         <Input
          placeholder="Filter by category..."
          value={(table.getColumn("categoryName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("categoryName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-left">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

export function TransactionTable() {
  return (
    <QueryClientProvider client={queryClient}>
      <TransactionTableContent />
    </QueryClientProvider>
  );
}
