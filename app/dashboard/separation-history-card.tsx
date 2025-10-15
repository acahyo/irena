
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Employee } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function SeparationHistoryCard({ separatedEmployees }: { separatedEmployees: Employee[] }) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const filteredEmployees = useMemo(() => {
    return separatedEmployees.filter(emp => {
      if (!emp.contractEndDate) return false;
      const separationDate = new Date(emp.contractEndDate);
      return separationDate.toISOString().slice(0, 7) === period;
    });
  }, [separatedEmployees, period]);

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'resign': return 'outline';
      case 'phk': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Karyawan Keluar per Periode</CardTitle>
        <CardDescription>Menampilkan karyawan yang resign atau di-PHK pada periode yang dipilih.</CardDescription>
        <Input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tanggal Keluar</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.contractEndDate ? format(new Date(emp.contractEndDate), 'PPP') : '-'}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(emp.employeeStatus)}>{emp.employeeStatus}</Badge></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Tidak ada data untuk periode ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
