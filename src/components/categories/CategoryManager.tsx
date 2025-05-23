"use client";

import React, { useState } from 'react';
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
import { PlusCircle, Trash2, Edit3, ListChecks, Tag } from 'lucide-react';
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

// Mock categories for now
const initialMockCategories: Category[] = [
  { id: 'cat_income_salary', name: 'Salary', type: 'income', createdAt: new Date(), userId: 'mockUser' },
  { id: 'cat_expense_food', name: 'Food & Dining', type: 'expense', createdAt: new Date(), userId: 'mockUser' },
  { id: 'cat_expense_transport', name: 'Transportation', type: 'expense', createdAt: new Date(), userId: 'mockUser' },
];

export function CategoryManager() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(initialMockCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>("expense");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);


  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Category name cannot be empty." });
      return;
    }
    const newCategory: Category = {
      id: `cat_${Date.now()}`, // Simple unique ID for mock
      name: newCategoryName,
      type: newCategoryType,
      createdAt: new Date(),
      userId: 'mockUser', // Placeholder
    };
    setCategories([...categories, newCategory]);
    setNewCategoryName("");
    toast({ title: "Category Added", description: `${newCategory.name} (${newCategory.type}) has been added.` });
  };
  
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryType(category.type);
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !newCategoryName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Category name cannot be empty." });
      return;
    }
    setCategories(categories.map(cat => 
      cat.id === editingCategory.id ? { ...cat, name: newCategoryName, type: newCategoryType } : cat
    ));
    setEditingCategory(null);
    setNewCategoryName("");
    toast({ title: "Category Updated", description: `${newCategoryName} has been updated.` });
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
    toast({ title: "Category Deleted", description: "The category has been removed." });
  };

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
            />
          </div>
          <div>
            <label htmlFor="categoryType" className="block text-sm font-medium text-foreground mb-1">Category Type</label>
            <Select value={newCategoryType} onValueChange={(value: 'income' | 'expense') => setNewCategoryType(value)}>
              <SelectTrigger id="categoryType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {editingCategory ? (
            <div className="flex space-x-2">
              <Button onClick={handleSaveEdit} className="w-full bg-primary hover:bg-primary/90">Save Changes</Button>
              <Button variant="outline" onClick={() => { setEditingCategory(null); setNewCategoryName(""); }} className="w-full">Cancel</Button>
            </div>
          ) : (
            <Button onClick={handleAddCategory} className="w-full bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Category
            </Button>
          )}
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
          {categories.length === 0 ? (
            <p className="text-muted-foreground">No categories found. Add some above!</p>
          ) : (
            <ul className="space-y-3">
              {categories.map(category => (
                <li key={category.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md shadow-sm">
                  <div>
                    <span className="font-medium">{category.name}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${category.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {category.type}
                    </span>
                  </div>
                  <div className="space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)} aria-label={`Edit ${category.name}`}>
                      <Edit3 className="h-4 w-4 text-blue-600" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Delete ${category.name}`}>
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
                          <AlertDialogAction onClick={() => handleDeleteCategory(category.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
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
