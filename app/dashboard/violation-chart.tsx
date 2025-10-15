

'use client';

import { TrendingUp } from 'lucide-react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ViolationRecord } from '@/lib/types';

const chartConfig = {
  SP1: {
    label: 'SP1',
    color: 'hsl(var(--chart-1))',
  },
  SP2: {
    label: 'SP2',
    color: 'hsl(var(--chart-2))',
  },
  SP3: {
    label: 'SP3',
    color: 'hsl(var(--chart-3))',
  },
  SPPT: {
    label: 'SPPT',
    color: 'hsl(var(--chart-4))',
  },
};

type ChartData = {
    month: string;
    SP1: number;
    SP2: number;
    SP3: number;
    SPPT: number;
}

export default function ViolationChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tren Pelanggaran Karyawan</CardTitle>
          <CardDescription>
            Grafik ini menunjukkan jumlah surat peringatan dari waktu ke waktu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-60 items-center justify-center text-muted-foreground">
            <p>Tidak ada data pelanggaran untuk ditampilkan pada grafik.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Pelanggaran Karyawan</CardTitle>
        <CardDescription>
          Grafik ini menunjukkan jumlah surat peringatan dari waktu ke waktu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
             <YAxis allowDecimals={false} />
            <Tooltip
                content={<ChartTooltipContent indicator="line" />}
            />
            <Legend />
            <Line dataKey="SP1" type="monotone" stroke={chartConfig.SP1.color} strokeWidth={2} dot={true} />
            <Line dataKey="SP2" type="monotone" stroke={chartConfig.SP2.color} strokeWidth={2} dot={true} />
            <Line dataKey="SP3" type="monotone" stroke={chartConfig.SP3.color} strokeWidth={2} dot={true} />
            <Line dataKey="SPPT" type="monotone" stroke={chartConfig.SPPT.color} strokeWidth={2} dot={true} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
