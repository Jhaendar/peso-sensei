
"use client";

import type { ColumnDef, Table } from "@tanstack/react-table";
import type { TransactionRow } from "@/lib/types";
import { ArrowUpDown, MoreHorizontal, ArrowUp, ArrowDown, Trash2, Edit } from "lucide-react"; // Added Edit icon
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, startOfDay, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Column, Row } from "@tanstack/react-table"; // Import Column and Row types

const SortIndicator = ({ column }: { column: Column<TransactionRow, unknown> }) => {
  const sortDirection = column.getIsSorted();
  if (sortDirection === "asc") {
    return <ArrowUp className="ml-2 h-4 w-4" />;
  }
  if (sortDirection === "desc") {
    return <ArrowDown className="ml-2 h-4 w-4" />;
  }
  return <ArrowUpDown className="ml-2 h-4 w-4" />;
};

// Define a type for the table's meta object
interface TableMeta {
  handleOpenDeleteDialog?: (transactionId: string) => void;
  handleOpenEditDialog?: (transaction: TransactionRow) => void; // Added for editing
  deleteTransactionMutation?: { isPending: boolean };
  // Add other meta properties here if needed
}

export const columns: ColumnDef<TransactionRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <SortIndicator column={column} />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      try {
        const parsedDate = parseISO(date + "T00:00:00"); 
        return <div className="text-left">{format(parsedDate, "MMM dd, yyyy")}</div>;
      } catch { // _e removed
        return <div className="text-left">{date}</div>; 
      }
    },
    filterFn: (row, columnId, filterValue: DateRange | undefined) => {
      if (!filterValue || (!filterValue.from && !filterValue.to)) {
        return true;
      }
      const rowDateStr = row.getValue(columnId) as string;
      const [year, month, day] = rowDateStr.split('-').map(Number);
      const rowDate = startOfDay(new Date(Date.UTC(year, month - 1, day)));

      const { from, to } = filterValue;
      let passesFrom = true;
      let passesTo = true;

      if (from) {
        passesFrom = rowDate >= startOfDay(from);
      }
      if (to) {
        passesTo = rowDate < addDays(startOfDay(to), 1);
      }
      return passesFrom && passesTo;
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <SortIndicator column={column} />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-left">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "categoryName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <SortIndicator column={column} />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-left">{row.getValue("categoryName") || "N/A"}</div>,
    filterFn: (row, columnId, filterValue: string[] | undefined) => {
      if (!filterValue || filterValue.length === 0) {
        return true; 
      }
      const rowValue = row.getValue(columnId) as string;
      return filterValue.includes(rowValue);
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <SortIndicator column={column} />
        </Button>
      );
    },
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      if (type === "income") {
        return (
          <Badge className="capitalize bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-700/30 dark:text-green-300 dark:hover:bg-green-700/40">
            Income
          </Badge>
        );
      }
      return (
        <Badge variant="destructive" className="capitalize">
          Expense
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right w-full justify-end"
        >
          Amount
          <SortIndicator column={column} />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }: { row: Row<TransactionRow>; table: Table<TransactionRow> }) => {
      const transaction = row.original; // No need for 'as TransactionRow' due to proper Row typing
      const meta = table.options.meta as TableMeta | undefined;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                if (transaction.id) {
                  navigator.clipboard.writeText(transaction.id);
                }
              }}
            >
              Copy transaction ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem // Edit transaction item
              onClick={() => {
                if (transaction) { // Pass the whole transaction object
                  meta?.handleOpenEditDialog?.(transaction);
                } else {
                  console.error("Cannot edit: Transaction data is undefined.");
                }
              }}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit transaction 
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (transaction.id) {
                  meta?.handleOpenDeleteDialog?.(transaction.id);
                } else {
                  console.error("Cannot delete: Transaction ID is undefined.");
                }
              }}
              className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
