
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

  const handleExport = () => {
    const dataToExport = employees.map(emp => ({
        'Nama Karyawan': emp.name,
        'Nomor Rekening': emp.accountNumber,
        'Total Gaji': emp.totalSalary,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
    // Set column widths
    worksheet['!cols'] = [
        { wch: 25 }, // Nama Karyawan
        { wch: 20 }, // Nomor Rekening
        { wch: 20 }, // Total Gaji
    ];
    XLSX.writeFile(workbook, `payroll_summary.xlsx`);
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
            <CardTitle>Payroll Summary</CardTitle>
            <CardDescription>
              View a summary of employee payroll data.
            </CardDescription>
          </div>
           <div className="flex flex-wrap items-center gap-2">
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
              <TableHead>Nomor Rekening</TableHead>
              <TableHead className="text-right">Total Gaji</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length > 0 ? (
              employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.accountNumber || 'N/A'}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(emp.totalSalary)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Tidak ada data karyawan ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
