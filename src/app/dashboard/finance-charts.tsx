'use client';

import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formatCurrency = (amount: number) => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} Miliar`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} Juta`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)} Ribu`;
  }
  return amount.toString();
};

export default function FinanceCharts({ expenseData }: { expenseData: { name: string; total: number }[] }) {
  if (!expenseData || expenseData.length === 0) {
    return null; // Don't render the chart if there's no data
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengeluaran per Proyek</CardTitle>
        <CardDescription>Visualisasi total pengeluaran yang telah disetujui untuk setiap proyek.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={expenseData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip
              formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)}
            />
            <Legend />
            <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Pengeluaran" activeBar={<Rectangle fill="var(--primary-focus)" stroke="var(--primary-stroke)" />} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
