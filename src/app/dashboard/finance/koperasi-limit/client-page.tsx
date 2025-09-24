'use client';

import { useState, useMemo, useTransition } from 'react';
import { format } from 'date-fns';
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
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/lib/types';
import { updateEmployee } from '@/actions/employees';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';


const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    return format(new Date(date), 'PPP');
}


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
  
  const handleValueChange = (employeeId: string, field: keyof Employee, value: string | number | Date | undefined) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId ? { ...emp, [field]: value } : emp
      )
    );
  };

  const handleSaveLimit = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    startTransition(async () => {
      try {
        await updateEmployee(employeeId, { 
            koperasiLimit: employee.koperasiLimit,
            koperasiLimitStartDate: employee.koperasiLimitStartDate,
            koperasiLimitEndDate: employee.koperasiLimitEndDate,
        });
        toast({
          title: 'Sukses!',
          description: `Data limit koperasi untuk ${employee.name} telah diperbarui.`,
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

  const DatePicker = ({ date, setDate }: { date: Date | string | undefined, setDate: (date: Date | undefined) => void }) => (
    <Popover>
        <PopoverTrigger asChild>
            <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal h-9', !date && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(new Date(date), 'PPP') : <span>Pilih tanggal</span>}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date ? new Date(date) : undefined} onSelect={setDate} initialFocus /></PopoverContent>
    </Popover>
  );


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Limit Belanja Koperasi</CardTitle>
            <CardDescription>
              Atur batas maksimal belanja bulanan dan periode berlakunya untuk setiap karyawan di koperasi.
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
              <TableHead>Limit (Rp)</TableHead>
              <TableHead>Tanggal Mulai</TableHead>
              <TableHead>Tanggal Selesai</TableHead>
              <TableHead className="w-[150px]">Aksi</TableHead>
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
                   <TableCell className="w-[200px]">
                     <Input
                        type="number"
                        placeholder="e.g. 500000"
                        value={emp.koperasiLimit || ''}
                        onChange={(e) => handleValueChange(emp.id, 'koperasiLimit', e.target.value)}
                      />
                  </TableCell>
                  <TableCell className="w-[200px]">
                      <DatePicker date={emp.koperasiLimitStartDate} setDate={(date) => handleValueChange(emp.id, 'koperasiLimitStartDate', date)} />
                  </TableCell>
                  <TableCell className="w-[200px]">
                      <DatePicker date={emp.koperasiLimitEndDate} setDate={(date) => handleValueChange(emp.id, 'koperasiLimitEndDate', date)} />
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleSaveLimit(emp.id)} size="sm" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
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
