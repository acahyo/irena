'use client';

import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const formatCurrency = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} Miliar`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} Jt`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)} Rb`;
  }
  return value.toString();
};

export default function FinanceCharts({ expenseData }: { expenseData: { name: string; total: number }[] }) {
  if (!expenseData || expenseData.length === 0) {
    return null; // Don't render the chart if there's no data
  }

  const chartConfig = {
    total: {
      label: 'Total Pengeluaran',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengeluaran per Proyek</CardTitle>
        <CardDescription>Visualisasi total pengeluaran yang telah disetujui untuk setiap proyek.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
          <BarChart accessibilityLayer data={expenseData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(Number(value))}
              label={{ value: 'IDR (Juta)', angle: -90, position: 'insideLeft', offset: -5 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Proyek: ${label}`}
                  formatter={(value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(value))}
                  indicator="dot"
                />
              }
            />
            <Bar
              dataKey="total"
              fill="var(--color-total)"
              radius={4}
              activeBar={<Rectangle fill="hsl(var(--primary) / 0.8)" />}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
