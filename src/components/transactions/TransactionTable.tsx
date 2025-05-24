
"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
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
import type { TransactionRow, Category } from "@/lib/types";
import { columns } from "./TransactionTableColumns";
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ListFilter, Filter, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker"; 
import { Label } from "@/components/ui/label";

interface TransactionTableContentProps {
  data: TransactionRow[];
  categories: Category[];
  isLoading?: boolean;
  error?: Error | null;
}

function TransactionTableContent({ data, categories, isLoading, error }: TransactionTableContentProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Local states for filter inputs
  const [titleFilter, setTitleFilter] = React.useState<string>("");
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters, // react-table manages this state
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Apply filters to the table when local filter states change
  React.useEffect(() => {
    table.getColumn("title")?.setFilterValue(titleFilter || undefined);
  }, [titleFilter, table]);

  React.useEffect(() => {
    table.getColumn("categoryName")?.setFilterValue(selectedCategories.length > 0 ? selectedCategories : undefined);
  }, [selectedCategories, table]);

  React.useEffect(() => {
    table.getColumn("date")?.setFilterValue(dateRange);
  }, [dateRange, table]);


  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => {
      const newSelected = prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName];
      return newSelected;
    });
  };
  
  const getCategoryFilterButtonText = () => {
    if (selectedCategories.length === 0) {
      return "Select categories...";
    }
    if (selectedCategories.length === 1) {
      return selectedCategories[0];
    }
    return `${selectedCategories.length} categories selected`;
  };

  const clearAllFilters = () => {
    setTitleFilter("");
    setSelectedCategories([]);
    setDateRange(undefined);
    // The useEffects above will propagate these empty values to table.setFilterValue
  };

  if (error) {
    return (
        <Card>
          <CardContent className="p-4">
            <p className="text-destructive">Error loading transaction table: {error.message}</p>
          </CardContent>
        </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center py-4">
          <Skeleton className="h-10 w-24" /> {/* Filter Button Skeleton */}
          <Skeleton className="ml-auto h-10 w-[120px]" /> {/* Columns Button Skeleton */}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((columnDef) => (
                   <TableHead key={columnDef.id || `skeleton-head-${(columnDef as any).accessorKey || Math.random()}`}><Skeleton className="h-5 w-20" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(null).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((columnDef) => (
                    <TableCell key={columnDef.id || `skeleton-cell-${rowIndex}-${(columnDef as any).accessorKey || Math.random()}`}><Skeleton className="h-5 w-full" /></TableCell>
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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 sm:w-[400px] md:w-[450px]" align="start">
            <div className="grid gap-4">
              <div className="space-y-1">
                <h4 className="font-medium leading-none text-lg">Apply Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Refine the transactions shown in the table.
                </p>
              </div>
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="filter-title" className="text-sm font-medium">Title</Label>
                  <Input
                    id="filter-title"
                    placeholder="Filter by title..."
                    value={titleFilter}
                    onChange={(event) => setTitleFilter(event.target.value)}
                    className="w-full mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between mt-1">
                        {getCategoryFilterButtonText()}
                        <ListFilter className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                      <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {categories.length > 0 && (
                        <DropdownMenuItem
                          onSelect={() => setSelectedCategories([])}
                          className="cursor-pointer"
                        >
                          Clear selection
                        </DropdownMenuItem>
                      )}
                      {categories.map((category) => (
                        <DropdownMenuCheckboxItem
                          key={category.id}
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                          onSelect={(e) => e.preventDefault()} 
                        >
                          {category.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                      {categories.length === 0 && (
                        <DropdownMenuItem disabled>No categories available</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                   <Label className="text-sm font-medium">Date Range</Label>
                   <DateRangePicker
                    selectedRange={dateRange}
                    onRangeChange={setDateRange}
                    className="w-full mt-1"
                  />
                </div>
              </div>
              <Button variant="ghost" onClick={clearAllFilters} className="text-sm text-destructive hover:bg-destructive/10 justify-start p-2">
                <XCircle className="mr-2 h-4 w-4"/> Clear All Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
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
                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
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

export function TransactionTable({ data, categories, isLoading, error }: TransactionTableContentProps) {
  return (
      <TransactionTableContent data={data} categories={categories || []} isLoading={isLoading} error={error} />
  );
}
