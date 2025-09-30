'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { HseRecord } from '@/lib/types';
import { updateHseRecord } from '@/actions/hse';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function IncidentFinesClientPage({
  incidentRecords,
}: {
  incidentRecords: HseRecord[];
}) {
  const [records, setRecords] = useState(incidentRecords);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handlePeriodsChange = (id: string, value: string) => {
    const newRecords = records.map((record) => {
      if (record.id === id) {
        return { ...record, fineDeductionPeriods: Number(value) };
      }
      return record;
    });
    setRecords(newRecords);
  };

  const handleSave = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;

    startTransition(async () => {
      try {
        await updateHseRecord(id, {
          fineDeductionPeriods: record.fineDeductionPeriods,
        });
        toast({
          title: 'Sukses!',
          description: `Periode potongan untuk ${record.employeeName} telah disimpan.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Gagal menyimpan periode potongan.',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Denda Insiden</CardTitle>
        <CardDescription>
          Atur periode cicilan untuk denda insiden karyawan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>Insiden</TableHead>
              <TableHead>Total Denda</TableHead>
              <TableHead>Periode Potongan (bulan)</TableHead>
              <TableHead>Potongan per Bulan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length > 0 ? (
              records.map((record) => {
                const deductionPerPeriod =
                  record.fineDeductionPeriods && record.fineDeductionPeriods > 0
                    ? (record.fineAmount || 0) / record.fineDeductionPeriods
                    : 0;

                return (
                  <TableRow key={record.id}>
                    <TableCell>{record.employeeName}</TableCell>
                    <TableCell>{record.title}</TableCell>
                    <TableCell>{formatCurrency(record.fineAmount || 0)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-24"
                        value={record.fineDeductionPeriods || ''}
                        onChange={(e) => handlePeriodsChange(record.id, e.target.value)}
                        min="1"
                      />
                    </TableCell>
                    <TableCell>
                      {deductionPerPeriod > 0
                        ? formatCurrency(deductionPerPeriod)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleSave(record.id)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Simpan
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada data insiden dengan denda yang perlu diatur.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
