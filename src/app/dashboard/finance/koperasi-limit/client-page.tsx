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
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/lib/types';
import { updateEmployee } from '@/actions/employees';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};


export default function KoperasiLimitClientPage({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);
  
  const handleLimitChange = (employeeId: string, value: string) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId ? { ...emp, koperasiLimit: Number(value) } : emp
      )
    );
  };

  const handleSaveLimit = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    startTransition(async () => {
      try {
        await updateEmployee(employeeId, { koperasiLimit: employee.koperasiLimit });
        toast({
          title: 'Sukses!',
          description: `Limit koperasi untuk ${employee.name} telah diperbarui.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Gagal memperbarui limit untuk ${employee.name}.`,
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Limit Belanja Koperasi</CardTitle>
            <CardDescription>
              Atur batas maksimal belanja bulanan untuk setiap karyawan di koperasi.
            </CardDescription>
          </div>
          <Input
            placeholder="Cari karyawan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Limit Saat Ini</TableHead>
              <TableHead className="w-[300px]">Atur Limit Baru</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                     <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={emp.avatar} alt={emp.name} />
                            <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{emp.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{emp.position || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(emp.koperasiLimit)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            placeholder="e.g. 500000"
                            value={emp.koperasiLimit || ''}
                            onChange={(e) => handleLimitChange(emp.id, e.target.value)}
                        />
                        <Button onClick={() => handleSaveLimit(emp.id)} size="sm" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Tidak ada karyawan ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
