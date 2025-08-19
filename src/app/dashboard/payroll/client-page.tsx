
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
import { Badge } from '@/components/ui/badge';


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
  const [positionFilter, setPositionFilter] = useState('all');

  const positions = useMemo(() => {
    const allPositions = employees.map((emp) => emp.position).filter(Boolean);
    return ['all', ...Array.from(new Set(allPositions as string[]))];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (positionFilter === 'all') {
      return employees;
    }
    return employees.filter((emp) => emp.position === positionFilter);
  }, [employees, positionFilter]);

  const handleExport = () => {
    const dataToExport = filteredEmployees.map(emp => ({
        'Nama Karyawan': emp.name,
        'Jabatan': emp.position,
        'Nomor Rekening': emp.accountNumber,
        'Tipe Gaji': emp.positionDetails?.salaryType,
        'Total Gaji': emp.totalSalary,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
    // Set column widths
    worksheet['!cols'] = [
        { wch: 25 }, // Nama Karyawan
        { wch: 20 }, // Jabatan
        { wch: 20 }, // Nomor Rekening
        { wch: 15 }, // Tipe Gaji
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
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by position" />
                    </SelectTrigger>
                    <SelectContent>
                        {positions.map((pos) => (
                            <SelectItem key={pos} value={pos}>
                                {pos === 'all' ? 'Semua Jabatan' : pos}
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
              <TableHead>Jabatan</TableHead>
              <TableHead>Nomor Rekening</TableHead>
              <TableHead>Tipe Gaji</TableHead>
              <TableHead className="text-right">Total Gaji</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.position || 'N/A'}</TableCell>
                  <TableCell>{emp.accountNumber || 'N/A'}</TableCell>
                   <TableCell>
                    {emp.positionDetails?.salaryType ? (
                      <Badge variant="outline" className="capitalize">{emp.positionDetails.salaryType}</Badge>
                    ) : (
                      <Badge variant="destructive">Not Set</Badge>
                    )}
                   </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(emp.totalSalary)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
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
