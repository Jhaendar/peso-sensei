
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

// Updated data to match the target image's legend
const initialChartData: ChartDataPoint[] = [
  { name: "Chrome", value: 245, fill: "hsl(var(--chart-1))" }, // Teal/Greenish
  { name: "Safari", value: 175, fill: "hsl(var(--chart-2))" }, // Orangey-Red
  { name: "Firefox", value: 140, fill: "hsl(var(--chart-3))" }, // Dark Teal/Blue-Grey
  { name: "Edge", value: 105, fill: "hsl(var(--chart-4))" }, // Yellow/Gold
  { name: "Other", value: 35, fill: "hsl(var(--chart-5))" }, // Light Orange/Peach
]

// Updated chartConfig to match the new data names
const chartConfig = {
  usage: { // A generic key, as the chart doesn't specify "expenses" anymore
    label: "Usage", // Label for tooltip, if needed
  },
  Chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  Safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  Firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  Edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  Other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function ExpenseDistributionChart() {
  // Removed timePeriod state and useEffect, as the chart is now static as per the image

  return (
    <Card className="flex flex-col shadow-lg">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl font-semibold">
            Pie Chart - Legend
        </CardTitle>
        <CardDescription>January - June 2024</CardDescription>
        {/* Removed Select component for time period */}
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
                data={initialChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110} // Slightly increased outerRadius for a common pie chart look
                innerRadius={0} // No inner radius for a standard pie chart, not a donut
                strokeWidth={1} // Reduced stroke width
                // Removed custom label function to hide labels on slices
              >
                {initialChartData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.fill} stroke={entry.fill} />
                ))}
              </Pie>
               <Legend 
                 wrapperStyle={{fontSize: "0.8rem", paddingTop: "20px"}} // Added padding to move legend down
                 align="center" 
                 layout="horizontal"
               />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      {/* Removed total expenses display */}
    </Card>
  )
}
