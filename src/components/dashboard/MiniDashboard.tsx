
import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface MiniDashboardProps {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  currency?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, currency = "PHP" }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-3 px-4">
      <CardTitle className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        {title}
      </CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent className="pb-3 px-4">
      <div className="text-2xl font-bold">
        {currency} {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </CardContent>
  </Card>
);


export function MiniDashboard({ totalIncome, totalExpenses, currentBalance }: MiniDashboardProps) {
  const formatCurrency = (value: number, currency: string = "PHP") => {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Mobile-first compact view
  const mobileSummary = (
    <Card className="shadow-lg md:hidden">
      <CardHeader className="px-4 pt-3 pb-2">
        <CardTitle className="text-sm font-semibold text-center">Monthly Summary</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Income:</span>
          <span>{formatCurrency(totalIncome)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expenses:</span>
          <span>{formatCurrency(totalExpenses)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span className="text-muted-foreground">Balance:</span>
          <span>{formatCurrency(currentBalance)}</span>
        </div>
      </CardContent>
    </Card>
  );

  // Desktop: 3-card layout
  const desktopSummary = (
    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        title="Current Month's Income" 
        value={totalIncome} 
        icon={<TrendingUp className="h-4 w-4" />} 
      />
      <StatCard 
        title="Current Month's Expenses" 
        value={totalExpenses} 
        icon={<TrendingDown className="h-4 w-4" />} 
      />
      <StatCard 
        title="Current Balance" 
        value={currentBalance} 
        icon={<Wallet className="h-4 w-4" />} 
      />
    </div>
  );

  return (
    <section aria-labelledby="mini-dashboard-title" className="mb-6">
       <h2 id="mini-dashboard-title" className="sr-only">Financial Summary</h2>
      {mobileSummary}
      {desktopSummary}
    </section>
  );
}
