import { MiniDashboard } from "@/components/dashboard/MiniDashboard";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { ExpenseDistributionChart } from "@/components/charts/ExpenseDistributionChart";
import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Peso Sensei',
};

export default function DashboardPage() {
  // Mock data for MiniDashboard
  const mockDashboardData = {
    totalIncome: 50000.00,
    totalExpenses: 25000.00,
    currentBalance: 25000.00,
  };

  return (
    <div className="space-y-8">
      <MiniDashboard 
        totalIncome={mockDashboardData.totalIncome}
        totalExpenses={mockDashboardData.totalExpenses}
        currentBalance={mockDashboardData.currentBalance}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 order-2 lg:order-1">
           <TransactionForm />
           <Button variant="outline" className="w-full mt-6 border-dashed border-primary text-primary hover:bg-primary/10 hover:text-primary" disabled>
            <ScanLine className="mr-2 h-5 w-5" />
            Scan Receipt with AI (Future)
          </Button>
        </div>
        <div className="lg:col-span-2 order-1 lg:order-2">
          <ExpenseDistributionChart />
        </div>
      </div>

      {/* Placeholder for transaction list if needed later */}
      {/* <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Transaction list will appear here.</p>
          </CardContent>
        </Card>
      </section> */}
    </div>
  );
}
