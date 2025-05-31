
"use client";

import React from "react";
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
import type { Category, TransactionFormData, TransactionRow } from "@/lib/types"; // Added TransactionRow and TransactionFormData
import { cn } from "@/lib/utils";
import { CalendarIcon, Landmark, ShoppingCart, Coins, Loader2, Scan, X } from "lucide-react"; // Added X icon
import { format, parse, parseISO } from "date-fns"; // Added parseISO
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { addDoc, collection, serverTimestamp, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { extractReceiptData, type ExtractReceiptDataInput, type ExtractReceiptDataOutput } from "@/ai/flows/extract-receipt-data";
import { ReceiptScanModal } from "./ReceiptScanModal";

const formSchema = z.object({
  type: z.enum(["income", "expense"], { required_error: "Please select a transaction type." }),
  // date: z.date({ required_error: "Please select a date." }),
  date: z.union([z.date(), z.string()]).transform((val) => typeof val === 'string' ? parseISO(val) : val), // Allow string for initialData
  title: z.string().min(1, { message: "Please enter a title." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  description: z.string().optional(),
});

// type TransactionFormData = z.infer<typeof formSchema>; // Already in types.ts

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
  categories: Category[]; // Pass categories as prop for editing consistency
  userId: string;
  initialData?: TransactionRow | null; // For editing
  isSubmitting?: boolean; // For loading state
  onCancel?: () => void; // To close the dialog
  isEditMode?: boolean; // To change submit button text and other UI elements
}

const fetchUserCategories = async (userId: string | undefined, type: 'income' | 'expense'): Promise<Category[]> => {
  if (!userId || !db || !type) return [];
  const categoriesCol = collection(db, "categories");
  const q = query(categoriesCol, where("userId", "==", userId), where("type", "==", type));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const createdAtRaw = data.createdAt;
    return {
      id: doc.id,
      ...data,
      createdAt: createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : new Date(createdAtRaw as any)
    } as Category;
  }).sort((a, b) => a.name.localeCompare(b.name));
};


export function TransactionForm({ 
  onSubmit: onSubmitProp, 
  initialData, 
  isSubmitting,
  onCancel,
  isEditMode = false 
}: TransactionFormProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // User from auth to ensure consistency
  const queryClientHook = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [isScanModalOpen, setIsScanModalOpen] = React.useState(false);
  const [scannedImageSrc, setScannedImageSrc] = React.useState<string | null>(null);
  const [extractedReceiptData, setExtractedReceiptData] = React.useState<ExtractReceiptDataOutput | null>(null);
  const [isAIScanning, setIsAIScanning] = React.useState(false);
  const [aiScanError, setAiScanError] = React.useState<string | null>(null);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
        ...initialData,
        date: initialData.date ? parseISO(initialData.date) : new Date(), // Ensure date is a Date object
        amount: initialData.amount || 0,
        description: initialData.description || "",
      } : {
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
    queryKey: ['categories', user?.uid, selectedType], // Use user.uid from auth
    queryFn: () => fetchUserCategories(user?.uid, selectedType),
    enabled: !!user && !!db && !!selectedType,
    staleTime: 5 * 60 * 1000, 
  });

  React.useEffect(() => {
    if (initialData) {
        const resetData = {
            ...initialData,
            date: initialData.date ? parseISO(initialData.date) : new Date(),
            amount: initialData.amount || 0,
            description: initialData.description || "",
            categoryId: initialData.categoryId || "",
        };
        form.reset(resetData);
    }
  }, [initialData, form.reset, form]);

  React.useEffect(() => {
    const currentCategoryId = form.getValues("categoryId");
    if (currentCategoryId && availableCategories && !availableCategories.find(cat => cat.id === currentCategoryId)) {
      // If initialData had a category that doesn't match the new type, reset it.
      // This can happen if the type is changed during an edit.
      if (initialData && initialData.type !== selectedType) {
        form.setValue("categoryId", "");
      }
    }
  }, [availableCategories, form, selectedType, initialData]);

  // Handler for form submission (create or update)
  async function onSubmit(values: TransactionFormData) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }
    if (!db) {
      toast({ variant: "destructive", title: "Database Error", description: "Could not connect to the database." });
      return;
    }

    // Use the passed onSubmitProp for actual data submission
    onSubmitProp(values);

    // Reset form only if not in edit mode (or handle reset after successful update via parent)
    if (!isEditMode) {
        form.reset({
            type: "expense",
            title: "",
            amount: 0,
            categoryId: "",
            date: new Date(),
            description: "",
        });
        // Invalidate queries for add mode, edit mode invalidation is handled in parent page
        const currentMonthKey = format(new Date(), "yyyy-MM");
        queryClientHook.invalidateQueries({ queryKey: ['monthlyTransactions', user?.uid, currentMonthKey] });
        queryClientHook.invalidateQueries({ queryKey: ['allUserTransactions', user?.uid] });
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user || !availableCategories) {
      toast({ variant: "destructive", title: "Scan Error", description: "User or categories not available." });
      return;
    }
    if (selectedType !== 'expense') {
      toast({ variant: "destructive", title: "Scan Not Applicable", description: "Receipt scanning is only for expense transactions." });
      return;
    }
    setAiScanError(null);
    setExtractedReceiptData(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const photoDataUri = reader.result as string;
      setScannedImageSrc(photoDataUri);
      setIsScanModalOpen(true);
      setIsAIScanning(true);
      try {
        const categoryNames = availableCategories.map(cat => cat.name);
        const result = await extractReceiptData({ photoDataUri, availableCategoryNames: categoryNames });
        setExtractedReceiptData(result);
      } catch (error: any) {
        setAiScanError(error.message || "Could not process the receipt image.");
      } finally {
        setIsAIScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      toast({ variant: "destructive", title: "File Error", description: "Could not read file." });
      setIsAIScanning(false); 
      setScannedImageSrc(null);
    };
  };

  const handleModalConfirm = (data: ExtractReceiptDataOutput) => {
    form.setValue("title", data.title || ""); 
    form.setValue("amount", data.amount > 0 ? data.amount : 0);
    if (data.date) {
      try {
        const parsedDate = parse(data.date, "yyyy-MM-dd", new Date());
        if (!isNaN(parsedDate.valueOf())) {
          form.setValue("date", parsedDate);
        } else {
          toast({ variant: "destructive", title: "AI Error", description: `AI returned invalid date: ${data.date}. Set manually.` });
        }
      } catch (e) {
        toast({ variant: "destructive", title: "AI Error", description: `Could not parse date from AI: ${data.date}. Set manually.` });
      }
    }
    if (availableCategories && data.category) {
        if (data.category.toLowerCase() === "other") {
            toast({ title: "AI Suggestion", description: `AI suggested "Other". Select manually or add it.`});
        } else {
            const matchedCategory = availableCategories.find(cat => cat.name.toLowerCase() === data.category.toLowerCase());
            if (matchedCategory && matchedCategory.id) {
                form.setValue("categoryId", matchedCategory.id);
                toast({ title: "AI Suggestion", description: `Category set: ${matchedCategory.name}` });
            } else {
                toast({ title: "AI Suggestion", description: `AI suggested: "${data.category}". Select or add it.` });
            }
        }
    }
    setIsScanModalOpen(false);
  };

  const cardTitle = isEditMode ? "Edit Transaction" : "Add New Transaction";
  const cardDescription = isEditMode ? "Update the details of your transaction." : "Record your income or expenses.";
  const submitButtonText = isEditMode ? (isSubmitting ? "Saving..." : "Save Changes") : (isSubmitting ? "Adding..." : "Add Transaction");

  return (
    <>
      {/* Conditionally render Card if not in a dialog (e.g., when used on a dedicated add page) */}
      {/* For this task, it's always in a dialog, so no Card wrapper here, it's in the page.tsx */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="grid grid-cols-[6rem_1fr] items-center gap-x-3">
                <FormLabel className="text-sm text-muted-foreground">Type</FormLabel>
                <div className="space-y-1">
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
              <FormItem className="grid grid-cols-[6rem_1fr] items-center gap-x-3">
                <FormLabel className="text-sm text-muted-foreground">Date</FormLabel>
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
                            format(field.value instanceof Date ? field.value : parseISO(field.value as string), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" side="bottom" align="start" sideOffset={5}>
                      <Calendar
                        mode="single"
                        selected={field.value instanceof Date ? field.value : parseISO(field.value as string)}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
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
              <FormItem className="grid grid-cols-[6rem_1fr] items-center gap-x-3">
                <FormLabel className="text-sm text-muted-foreground">Title</FormLabel>
                <div className="space-y-1">
                  <FormControl>
                    <Input placeholder="e.g., Weekly Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {selectedType === 'expense' && !isEditMode && ( // Disable AI scan in edit mode for now
            <FormItem className="grid grid-cols-[6rem_1fr] items-center gap-x-3">
              <FormLabel className="text-sm text-muted-foreground">Receipt</FormLabel>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAIScanning || !user || isLoadingCategories}
              >
                <Scan className="mr-2 h-4 w-4" />
                Scan Receipt with AI
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" disabled={isAIScanning} />
            </FormItem>
          )}

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="grid grid-cols-[6rem_1fr] items-center gap-x-3">
                <FormLabel className="text-sm text-muted-foreground">Amount (PHP)</FormLabel>
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
              <FormItem className="grid grid-cols-[6rem_1fr] items-center gap-x-3">
                <FormLabel className="text-sm text-muted-foreground">Category</FormLabel>
                <div className="space-y-1">
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    defaultValue={field.value} 
                    disabled={isLoadingCategories || !availableCategories || availableCategories.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingCategories ? "Loading categories..." :
                            categoriesError ? `Error...` :
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
                  {categoriesError && <FormMessage>{`Error: ${(categoriesError.message || 'Error loading categories.').substring(0,60)}...`}</FormMessage>}
                  {!categoriesError && (!availableCategories || availableCategories.length === 0) && !isLoadingCategories && (
                    <FormMessage>No {selectedType} categories. Add in 'Manage Categories'.</FormMessage>
                  )}
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
                <FormLabel className="text-sm text-muted-foreground">Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Bought items from SM Supermarket..." {...field} value={field.value || ""}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="submit" className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || !user || !db || isAIScanning}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Coins className="mr-2 h-5 w-5" />
              )}
              {submitButtonText}
            </Button>
            {onCancel && (
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel} disabled={isSubmitting}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
            )}
          </div>
        </form>
      </Form>
      {!isEditMode && (
          <ReceiptScanModal
            isOpen={isScanModalOpen}
            onOpenChange={setIsScanModalOpen}
            imageSrc={scannedImageSrc}
            extractedData={extractedReceiptData}
            isLoading={isAIScanning}
            error={aiScanError}
            onConfirm={handleModalConfirm}
          />
      )}
    </>
  );
}
