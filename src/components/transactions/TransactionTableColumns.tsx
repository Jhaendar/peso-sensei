
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TransactionRow } from "@/lib/types";
import { ArrowUpDown, MoreHorizontal, ArrowUp, ArrowDown } from "lucide-react";
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
import { format, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

const SortIndicator = ({ column }: { column: any }) => {
  const sortDirection = column.getIsSorted();
  if (sortDirection === "asc") {
    return <ArrowUp className="ml-2 h-4 w-4" />;
  }
  if (sortDirection === "desc") {
    return <ArrowDown className="ml-2 h-4 w-4" />;
  }
  return <ArrowUpDown className="ml-2 h-4 w-4" />;
};

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
        // Ensure date is treated as UTC to avoid off-by-one day errors due to timezone conversion
        const [year, month, day] = date.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        return <div className="text-left">{format(utcDate, "MMM dd, yyyy")}</div>;
      } catch (e) {
        return <div className="text-left">{date}</div>;
      }
    },
    filterFn: (row, columnId, filterValue: DateRange | undefined) => {
      if (!filterValue || (!filterValue.from && !filterValue.to)) {
        return true;
      }
      const rowDateStr = row.getValue(columnId) as string;
      // Parse rowDateStr: "yyyy-MM-dd"
      const [year, month, day] = rowDateStr.split('-').map(Number);
      const rowDate = startOfDay(new Date(Date.UTC(year, month - 1, day)));

      const { from, to } = filterValue;
      let passesFrom = true;
      let passesTo = true;

      if (from) {
        passesFrom = rowDate >= startOfDay(from);
      }
      if (to) {
        // For 'to' date, we should include the entire day, so compare with end of day or start of next day
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
      return (
        <Badge variant={type === "income" ? "default" : "destructive"} className={type === "income" ? "bg-green-500/20 text-green-700 hover:bg-green-500/30" : "bg-red-500/20 text-red-700 hover:bg-red-500/30"}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
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
        return true; // No filter applied or empty filter array
      }
      const rowValue = row.getValue(columnId) as string;
      return filterValue.includes(rowValue);
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
    cell: ({ row }) => {
      const transaction = row.original;
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
              onClick={() => navigator.clipboard.writeText(transaction.id || "")}
            >
              Copy transaction ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Edit transaction</DropdownMenuItem>
            <DropdownMenuItem disabled className="text-destructive">Delete transaction</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
