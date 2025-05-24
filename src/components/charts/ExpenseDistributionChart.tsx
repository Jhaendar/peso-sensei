"use client"

import * as React from "react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartDataPoint } from "@/lib/types"

interface ExpenseDistributionChartProps {
  data: ChartDataPoint[];
  config: ChartConfig;
  title: string;
}

export function ExpenseDistributionChart({ data, config, title }: ExpenseDistributionChartProps) {
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
  }, [data])


  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <Card className="flex flex-col shadow-lg h-[400px] items-center justify-center">
        <CardHeader className="items-center pb-0 px-4 pt-4">
          <CardTitle className="text-lg font-semibold text-center">
              {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <p className="text-muted-foreground">No data to display for this period.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col shadow-lg h-[400px]">
      <CardHeader className="items-center pb-2 px-4 pt-4">
        <CardTitle className="text-lg font-semibold text-center">
            {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[300px] sm:max-h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="name" />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100} // Slightly smaller radius for compactness
                innerRadius={0} 
                strokeWidth={1.5}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}-${entry.name}`} fill={entry.fill} stroke={entry.fill} />
                ))}
              </Pie>
               <Legend 
                 wrapperStyle={{fontSize: "0.75rem", paddingTop: "10px"}} // Smaller font, less padding
                 align="center" 
                 layout="horizontal"
                 iconSize={10} // Smaller legend icon
               />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
