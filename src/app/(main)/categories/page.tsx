
import { CategoryManager } from '@/components/categories/CategoryManager';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Categories - Peso Sensei',
};

export default function CategoriesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-primary">Manage Categories</h1>
      <CategoryManager />
    </div>
  );
}
