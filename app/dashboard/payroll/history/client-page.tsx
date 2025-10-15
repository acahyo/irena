
'use client';

import { useState, useMemo, useTransition } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, Download } from 'lucide-react';
import type { PayrollRecord } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { getPayrollHistoryByPeriod } from '@/actions/payroll';
import { Label } from '@/components/ui/label';

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function PayrollHistoryClientPage({ initialHistory }: { initialHistory: PayrollRecord[] }) {
  const { toast } = useToast();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [history, setHistory] = useState(initialHistory);
  const [isFetching, startFetching] = useTransition();

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    startFetching(async () => {
        try {
            const records = await getPayrollHistoryByPeriod(newPeriod);
            setHistory(records);
        } catch(err) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch payroll history.'});
        }
    });
  }

  const handleExport = () => {
    const dataToExport = history.map(rec => ({
        'Periode': rec.period,
        'Tanggal Dibuat': format(parseISO(rec.generationDate as string), 'PPP'),
        'ID Karyawan': rec.employeeId,
        'Nama Karyawan': rec.employeeName,
        'Total Pendapatan': rec.totalEarnings,
        'Total Potongan': rec.totalDeductions,
        'Gaji Bersih': rec.netSalary,
        'Nama Bank': rec.bankName,
        'Nomor Rekening': rec.accountNumber,
        'Keterangan': rec.keterangan,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Payroll History ${period}`);
    XLSX.writeFile(workbook, `payroll_history_${period}.xlsx`);
    toast({
      title: 'Success!',
      description: 'Payroll history data has been exported.',
    });
  };

  const totalNetSalary = useMemo(() => {
    return history.reduce((sum, rec) => sum + rec.netSalary, 0);
  }, [history]);

  return (
    <div className="space-y-6">
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gaji Bersih (Periode Ini)</CardTitle>
            
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalNetSalary)}</div>
        </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Riwayat Penggajian</CardTitle>
            <CardDescription>
              Lihat dan ekspor catatan gaji yang telah dibuat.
            </CardDescription>
          </div>
           <div className="flex flex-wrap items-center gap-2">
                 <div className="space-y-2">
                    <Label htmlFor="period">Periode</Label>
                    <Input
                        id="period"
                        type="month"
                        value={period}
                        onChange={(e) => handlePeriodChange(e.target.value)}
                        disabled={isFetching}
                    />
                 </div>
                 <Button variant="outline" onClick={handleExport} disabled={history.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Ekspor
                </Button>
           </div>
        </div>
      </CardHeader>
      <CardContent>
        {isFetching ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Total Pendapatan</TableHead>
              <TableHead>Total Potongan</TableHead>
              <TableHead className="text-right">Gaji Bersih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length > 0 ? (
              history.map((rec, index) => (
                <TableRow key={`${rec.id}-${rec.employeeId}-${index}`}>
                  <TableCell className="font-medium">{rec.employeeName}</TableCell>
                  <TableCell>{rec.period}</TableCell>
                  <TableCell>{formatCurrency(rec.totalEarnings)}</TableCell>
                  <TableCell>{formatCurrency(rec.totalDeductions)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(rec.netSalary)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada data riwayat penggajian untuk periode ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
