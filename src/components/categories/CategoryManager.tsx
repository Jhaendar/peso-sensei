"use client";

import React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";
import { PlusCircle, Trash2, Edit3, ListChecks, Tag, AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/components/providers/auth-provider';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, doc, Timestamp, serverTimestamp } from 'firebase/firestore'; // Added Timestamp
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys, invalidateTransactionQueries } from '@/lib/utils';

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

function CategoryManagerContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClientHook = useQueryClient(); // Use the shared QueryClient from context

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>("expense");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Use standardized query key
  const { data: categories, isLoading, error } = useQuery<Category[], Error>({
    queryKey: queryKeys.categories.all(user?.uid || ''),
    queryFn: () => fetchUserCategories(user?.uid),
    enabled: !!user && !!db,
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (newCategoryData: Omit<Category, 'id' | 'createdAt' | 'userId'>) => {
      if (!user || !db) throw new Error("User or DB not available");
      return addDoc(collection(db, "categories"), {
        ...newCategoryData,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      toast({ title: "Category Added", description: `${newCategoryName} (${newCategoryType}) has been added.` });
      setNewCategoryName("");
      setNewCategoryType("expense"); 
      // Use standardized cache invalidation for categories
      invalidateTransactionQueries(queryClientHook, user?.uid || '');
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error Adding Category", description: err.message });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (categoryToUpdate: { id: string; name: string; type: 'income' | 'expense' }) => {
      if (!user || !db) throw new Error("User or DB not available");
      const categoryRef = doc(db, "categories", categoryToUpdate.id);
      return updateDoc(categoryRef, { name: categoryToUpdate.name, type: categoryToUpdate.type });
    },
    onSuccess: (_, variables) => {
      toast({ title: "Category Updated", description: `${variables.name} has been updated.` });
      setEditingCategory(null);
      setNewCategoryName("");
      setNewCategoryType("expense");
      // Use standardized cache invalidation for categories
      invalidateTransactionQueries(queryClientHook, user?.uid || '');
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error Updating Category", description: err.message });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user || !db) throw new Error("User or DB not available");
      // First, check if this category is being used in any transactions
      const transactionsCol = collection(db, "transactions");
      const q = query(transactionsCol, where("userId", "==", user.uid), where("categoryId", "==", categoryId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        throw new Error("Cannot delete category that is being used in transactions.");
      }
      return deleteDoc(doc(db, "categories", categoryId));
    },
    onSuccess: () => {
      toast({ title: "Category Deleted", description: "Category has been deleted." });
      // Use standardized cache invalidation for categories
      invalidateTransactionQueries(queryClientHook, user?.uid || '');
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error Deleting Category", description: err.message });
    },
  });

  const handleAddOrUpdateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Category name cannot be empty." });
      return;
    }
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id!, name: newCategoryName, type: newCategoryType });
    } else {
      addCategoryMutation.mutate({ name: newCategoryName, type: newCategoryType });
    }
  };
  
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryType(category.type);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryType("expense");
  }

  if (!user && !isLoading) {
      return <p className="text-center text-muted-foreground p-4">Please log in to manage categories.</p>
  }

  if (!db && user) {
    return (
      <Card className="shadow-lg m-auto max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-6 w-6" />
            Database Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Could not connect to the database. Please ensure Firebase is configured correctly and try again later.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <Tag className="mr-2 h-6 w-6 text-accent" />
            {editingCategory ? "Edit Category" : "Add New Category"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-foreground mb-1">Category Name</label>
            <Input
              id="categoryName"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Groceries, Salary"
              disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
            />
          </div>
          <div>
            <label htmlFor="categoryType" className="block text-sm font-medium text-foreground mb-1">Category Type</label>
            <Select 
                value={newCategoryType} 
                onValueChange={(value: 'income' | 'expense') => setNewCategoryType(value)}
                disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              <SelectTrigger id="categoryType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button 
                onClick={handleAddOrUpdateCategory} 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending || !newCategoryName.trim()}
            >
              {editingCategory ? (
                updateCategoryMutation.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
                ) : (
                  "Save Changes"
                )
              ) : (
                addCategoryMutation.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Adding...</>
                ) : (
                  <><PlusCircle className="mr-2 h-5 w-5" /> Add Category</>
                )
              )}
            </Button>
            {editingCategory && (
              <Button variant="outline" onClick={handleCancelEdit} className="w-full" disabled={updateCategoryMutation.isPending}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <ListChecks className="mr-2 h-6 w-6 text-primary" />
            Existing Categories
          </CardTitle>
          <CardDescription>Manage your income and expense categories.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          )}
          {error && <p className="text-destructive">Error loading categories: {error.message}</p>}
          {!isLoading && !error && categories && categories.length === 0 && (
            <p className="text-muted-foreground">No categories found. Add some above!</p>
          )}
          {!isLoading && !error && categories && categories.length > 0 && (
            <ul className="space-y-3">
              {categories.map(category => (
                <li key={category.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md shadow-sm">
                  <div>
                    <span className="font-medium">{category.name}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full capitalize ${
                      category.type === 'income' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300'
                    }`}>
                      {category.type}
                    </span>
                  </div>
                  <div className="space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)} aria-label={`Edit ${category.name}`} disabled={deleteCategoryMutation.isPending || updateCategoryMutation.isPending || addCategoryMutation.isPending}>
                      <Edit3 className="h-4 w-4 text-blue-600" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Delete ${category.name}`} disabled={deleteCategoryMutation.isPending || updateCategoryMutation.isPending || addCategoryMutation.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the category "{category.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteCategoryMutation.mutate(category.id!)} 
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={deleteCategoryMutation.isPending}
                          >
                            {deleteCategoryMutation.isPending ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CategoryManager() {
  return <CategoryManagerContent />;
}
