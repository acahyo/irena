'use client';

import { useState, useMemo, useTransition } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, Save, Calendar as CalendarIcon } from 'lucide-react';
import type { EmployeeWithDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { savePayrollHistoryBatch } from '@/actions/payroll';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function PayrollClientPage({ employees, period }: { employees: EmployeeWithDetails[], period: string }) {
  const { toast } = useToast();
  const [bankFilter, setBankFilter] = useState('all');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>();
  const [isSaving, startSaving] = useTransition();

  const banks = useMemo(() => {
    const allBanks = employees.map((emp) => emp.bankName).filter(Boolean);
    return ['all', ...Array.from(new Set(allBanks as string[]))];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (bankFilter === 'all') {
      return employees;
    }
    return employees.filter((emp) => emp.bankName === bankFilter);
  }, [employees, bankFilter]);

  const handleExport = () => {
    const dataToExport = filteredEmployees.map(emp => ({
        'Nama Karyawan': emp.name,
        'Nomor Rekening': emp.accountNumber,
        'Bank': emp.bankName,
        'Gaji Bersih': emp.netSalary,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
    // Set column widths
    worksheet['!cols'] = [
        { wch: 25 }, // Nama Karyawan
        { wch: 20 }, // Nomor Rekening
        { wch: 20 }, // Bank
        { wch: 20 }, // Gaji Bersih
    ];
    XLSX.writeFile(workbook, `payroll_summary_${bankFilter}.xlsx`);
    toast({
      title: 'Success!',
      description: 'Payroll data has been exported.',
    });
  };

  const handleVerifyAndSave = () => {
      if (filteredEmployees.length === 0) {
          toast({ variant: 'destructive', title: 'Tidak ada data', description: 'Tidak ada data karyawan untuk disimpan.' });
          return;
      }
      if (!paymentDate) {
          toast({ variant: 'destructive', title: 'Tanggal Pembayaran Wajib Diisi', description: 'Silakan pilih tanggal pembayaran sebelum menyimpan.' });
          return;
      }
      
      startSaving(async () => {
          const recordsToSave = filteredEmployees.map(emp => ({
              employeeId: emp.id,
              employeeName: emp.name,
              period,
              paymentDate,
              earnings: emp.earnings,
              deductions: emp.deductions,
              totalEarnings: emp.totalEarnings,
              totalDeductions: emp.totalDeductions,
              netSalary: emp.netSalary,
              bankName: emp.bankName,
              accountNumber: emp.accountNumber,
          }));

          const result = await savePayrollHistoryBatch(recordsToSave);
          if (result.success) {
              toast({ title: 'Sukses!', description: `${result.count} data riwayat payroll telah disimpan.` });
          } else {
              toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan riwayat payroll.' });
          }
      });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Ringkasan Transfer Gaji</CardTitle>
            <CardDescription>
              Ringkasan gaji bersih karyawan yang siap ditransfer.
            </CardDescription>
          </div>
           <div className="flex flex-wrap items-end gap-2">
                 <Select value={bankFilter} onValueChange={setBankFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by Bank" />
                    </SelectTrigger>
                    <SelectContent>
                        {banks.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                                {bank === 'all' ? 'Semua Bank' : bank}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
                <div className="space-y-1">
                    <Label htmlFor="paymentDate" className="text-xs">Tanggal Pembayaran (Wajib)</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            id="paymentDate"
                            variant={'outline'}
                            className={cn('w-[240px] justify-start text-left font-normal', !paymentDate && 'text-muted-foreground')}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {paymentDate ? format(paymentDate, 'PPP') : <span>Pilih tanggal</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <Button onClick={handleVerifyAndSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Verifikasi &amp; Simpan
                </Button>
           </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Nomor Rekening</TableHead>
              <TableHead className="text-right">Gaji Bersih (Net Salary)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.bankName || 'N/A'}</TableCell>
                  <TableCell>{emp.accountNumber || 'N/A'}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(emp.netSalary)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Tidak ada data karyawan ditemukan untuk filter ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
