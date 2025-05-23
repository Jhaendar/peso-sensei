
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
  const formatCurrency = (value: number, currency: string = "PHP") => {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <section aria-labelledby="mini-dashboard-title" className="mb-8">
       <h2 id="mini-dashboard-title" className="sr-only">Financial Summary</h2>
      
      {/* Three-card layout for medium screens and up */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
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

      {/* Single-card compact layout for small screens */}
      <div className="block md:hidden">
        <Card className="shadow-lg">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm pt-2 pb-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Income:</span>
              <span className="font-semibold text-green-600">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Expenses:</span>
              <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-border mt-1.5">
              <span className="text-muted-foreground font-medium">Balance:</span>
              <span className="font-bold text-primary">{formatCurrency(currentBalance)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
