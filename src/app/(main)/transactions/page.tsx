
import type { Metadata } from 'next';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListFilter } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Transactions - Peso Sensei',
  description: 'View and manage your financial transactions.',
};

export default function TransactionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Transactions</h1>
          <p className="text-muted-foreground">
            View, filter, and sort your income and expenses.
          </p>
        </div>
      </div>
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
          <TransactionTable />
        </CardContent>
      </Card>
    </div>
  );
}
