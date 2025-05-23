import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";

interface MiniDashboardProps {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; currency?: string }> = ({ title, value, icon, currency = "PHP" }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {currency} {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </CardContent>
  </Card>
);


export function MiniDashboard({ totalIncome, totalExpenses, currentBalance }: MiniDashboardProps) {
  return (
    <section aria-labelledby="mini-dashboard-title" className="mb-8">
       <h2 id="mini-dashboard-title" className="sr-only">Financial Summary</h2>
      <div className="grid gap-4 md:grid-cols-3 sm:grid-cols-1">
        <StatCard 
          title="Current Month's Income" 
          value={totalIncome} 
          icon={<TrendingUp className="h-5 w-5 text-green-500" />} 
        />
        <StatCard 
          title="Current Month's Expenses" 
          value={totalExpenses} 
          icon={<TrendingDown className="h-5 w-5 text-red-500" />} 
        />
        <StatCard 
          title="Current Balance" 
          value={currentBalance} 
          icon={<Wallet className="h-5 w-5 text-primary" />} 
        />
      </div>
    </section>
  );
}
