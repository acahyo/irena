'use client';

import { useState, useMemo } from 'react';
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
import { Download } from 'lucide-react';
import type { EmployeeWithDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function PayrollClientPage({ employees }: { employees: EmployeeWithDetails[] }) {
  const { toast } = useToast();
  const [bankFilter, setBankFilter] = useState('all');

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
           <div className="flex flex-wrap items-center gap-2">
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
