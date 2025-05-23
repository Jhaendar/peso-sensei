"use client"

import * as React from "react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ChartDataPoint } from "@/lib/types"
import { PieChart as PieChartIcon } from "lucide-react"


const initialChartData: ChartDataPoint[] = [
  { name: "Food & Dining", value: 400, fill: "hsl(var(--chart-1))" },
  { name: "Transportation", value: 300, fill: "hsl(var(--chart-2))" },
  { name: "Housing", value: 300, fill: "hsl(var(--chart-3))" },
  { name: "Utilities", value: 200, fill: "hsl(var(--chart-4))" },
  { name: "Entertainment", value: 278, fill: "hsl(var(--chart-5))" },
]

const chartConfig = {
  expenses: {
    label: "Expenses",
  },
  food: {
    label: "Food & Dining",
    color: "hsl(var(--chart-1))",
  },
  transportation: {
    label: "Transportation",
    color: "hsl(var(--chart-2))",
  },
  housing: {
    label: "Housing",
    color: "hsl(var(--chart-3))",
  },
  utilities: {
    label: "Utilities",
    color: "hsl(var(--chart-4))",
  },
  entertainment: {
    label: "Entertainment",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function ExpenseDistributionChart() {
  const [timePeriod, setTimePeriod] = React.useState("current_month")
  const [chartData, setChartData] = React.useState(initialChartData);

  // Mock data filtering based on time period
  React.useEffect(() => {
    // In a real app, you would fetch and filter data based on timePeriod
    if (timePeriod === "last_3_months") {
      setChartData([
        { name: "Food & Dining", value: 1200, fill: "hsl(var(--chart-1))" },
        { name: "Transportation", value: 900, fill: "hsl(var(--chart-2))" },
        { name: "Housing", value: 900, fill: "hsl(var(--chart-3))" },
        { name: "Utilities", value: 600, fill: "hsl(var(--chart-4))" },
        { name: "Entertainment", value: 834, fill: "hsl(var(--chart-5))" },
      ]);
    } else if (timePeriod === "year_to_date") {
       setChartData([
        { name: "Food & Dining", value: 4800, fill: "hsl(var(--chart-1))" },
        { name: "Transportation", value: 3600, fill: "hsl(var(--chart-2))" },
        { name: "Housing", value: 3600, fill: "hsl(var(--chart-3))" },
        { name: "Utilities", value: 2400, fill: "hsl(var(--chart-4))" },
        { name: "Entertainment", value: 3336, fill: "hsl(var(--chart-5))" },
      ]);
    } else { // current_month
      setChartData(initialChartData);
    }
  }, [timePeriod]);

  const totalExpenses = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData])

  return (
    <Card className="flex flex-col shadow-lg">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl font-semibold flex items-center">
            <PieChartIcon className="mr-2 h-6 w-6 text-primary" />
            Expense Distribution
        </CardTitle>
        <CardDescription>By category for the selected period.</CardDescription>
        <div className="w-full max-w-[200px] pt-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger aria-label="Select time period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="year_to_date">Year-to-Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px] sm:max-h-[350px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="name" />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                strokeWidth={2}
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + (radius + 15) * Math.cos(-midAngle * RADIAN);
                  const y = cy + (radius + 15) * Math.sin(-midAngle * RADIAN);
                  if (percent * 100 < 5) return null; // Hide label if slice is too small
                  return (
                    <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                      {`${name} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  );
                }}
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
              </Pie>
               <Legend wrapperStyle={{fontSize: "0.8rem"}} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <div className="p-4 text-center text-sm text-muted-foreground">
        Total Expenses: PHP {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </Card>
  )
}
