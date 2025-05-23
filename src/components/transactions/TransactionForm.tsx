
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarIcon, Landmark, ShoppingCart, Coins } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import React from "react";
import { addDoc, collection, Timestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";

const formSchema = z.object({
  type: z.enum(["income", "expense"], { required_error: "Please select a transaction type." }),
  date: z.date({ required_error: "Please select a date." }),
  title: z.string().min(1, { message: "Please enter a title." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  description: z.string().optional(),
});

const fetchUserCategories = async (userId: string, type: 'income' | 'expense'): Promise<Category[]> => {
  if (!userId || !db) return [];
  const categoriesCol = collection(db, "categories");
  const q = query(categoriesCol, where("userId", "==", userId), where("type", "==", type));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: (doc.data().createdAt as Timestamp).toDate() } as Category));
};

function TransactionFormContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      title: "",
      amount: 0,
      categoryId: "",
      date: new Date(),
      description: "",
    },
  });

  const selectedType = form.watch("type");

  const { data: availableCategories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>({
    queryKey: ['categories', user?.uid, selectedType],
    queryFn: () => fetchUserCategories(user!.uid, selectedType),
    enabled: !!user && !!db,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  React.useEffect(() => {
    // Reset categoryId if the selected category is no longer in the filtered list
    const currentCategoryId = form.getValues("categoryId");
    if (currentCategoryId && availableCategories && !availableCategories.find(cat => cat.id === currentCategoryId)) {
      form.setValue("categoryId", "");
    }
  }, [availableCategories, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to add a transaction.",
      });
      return;
    }
    if (!db) {
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not connect to the database. Please try again later.",
      });
      return;
    }

    try {
      const transactionData = {
        ...values,
        date: format(values.date, "yyyy-MM-dd"), // Format date for submission
        userId: user.uid,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, "transactions"), transactionData);
      
      toast({
        title: "Transaction Added",
        description: `Your ${values.type} "${values.title}" has been successfully recorded.`,
      });
      form.reset({ 
        type: "expense",
        title: "",
        amount: 0,
        categoryId: "",
        date: new Date(),
        description: "",
      });
      // Consider refetching dashboard data if this form is on the dashboard page
      // queryClient.invalidateQueries(['monthlyTransactions', user?.uid, format(new Date(), "yyyy-MM")]);
    } catch (error) {
      console.error("Error adding transaction: ", error);
      toast({
        variant: "destructive",
        title: "Error Adding Transaction",
        description: "Could not save the transaction. Please try again.",
      });
    }
  }
  
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pb-2">
        <CardTitle className="text-lg sm:text-xl font-semibold flex items-center">
          {selectedType === "income" ? <Landmark className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-green-500" /> : <ShoppingCart className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-red-500" />}
          Add New Transaction
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Quickly record your income or expenses.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-2 pb-4 sm:px-6 sm:pt-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 sm:space-y-3">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[8rem_1fr] items-center gap-x-3">
                  <FormLabel>Type</FormLabel>
                  <div className="space-y-1">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[8rem_1fr] items-center gap-x-3">
                  <FormLabel>Date</FormLabel>
                  <div className="space-y-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[8rem_1fr] items-center gap-x-3">
                  <FormLabel>Title</FormLabel>
                  <div className="space-y-1">
                    <FormControl>
                      <Input placeholder="e.g., Weekly Groceries" {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (PHP)</FormLabel>
                  <div className="space-y-1">
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <div className="space-y-1">
                    <Select 
                        onValueChange={field.onChange} 
                        value={field.value} 
                        disabled={isLoadingCategories || !availableCategories || availableCategories.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isLoadingCategories ? "Loading categories..." : 
                            !availableCategories || availableCategories.length === 0 ? `No ${selectedType} categories` : 
                            "Select a category"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories && availableCategories.map(category => (
                          <SelectItem key={category.id} value={category.id!}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {categoriesError && <FormMessage>Error loading categories.</FormMessage>}
                    <FormMessage /> 
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Bought items from SM Supermarket including milk, bread, eggs..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting || !user || !db}>
               <Coins className="mr-2 h-5 w-5" /> {form.formState.isSubmitting ? "Adding..." : "Add Transaction"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const queryClient = new QueryClient();

export function TransactionForm() {
  return (
    <QueryClientProvider client={queryClient}>
      <TransactionFormContent />
    </QueryClientProvider>
  );
}
