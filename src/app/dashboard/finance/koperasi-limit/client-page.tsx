

'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
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
import { Loader2, Calendar as CalendarIcon, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Employee, Position, Site } from '@/lib/types';
import { updateEmployee, updateKoperasiLimitPeriode } from '@/actions/employees';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';


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


export default function KoperasiLimitClientPage({ initialEmployees, positions, sites }: { initialEmployees: Employee[], positions: Position[], sites: Site[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [collectiveStartDate, setCollectiveStartDate] = useState<Date | undefined>();
  const [collectiveEndDate, setCollectiveEndDate] = useState<Date | undefined>();


  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (positionFilter === 'all' || emp.positions?.includes(positionFilter)) &&
      (projectFilter === 'all' || emp.siteLocation === projectFilter)
    );
  }, [employees, searchTerm, positionFilter, projectFilter]);
  
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
        });
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
  
  const handleApplyCollectivePeriod = () => {
    if (!collectiveStartDate || !collectiveEndDate) {
        toast({ variant: 'destructive', title: 'Error', description: 'Silakan pilih tanggal mulai dan selesai.' });
        return;
    }
    if (filteredEmployees.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Tidak ada karyawan yang cocok dengan filter untuk diterapkan.' });
        return;
    }
    
    startTransition(async () => {
        const employeeIds = filteredEmployees.map(e => e.id);
        try {
            await updateKoperasiLimitPeriode(employeeIds, collectiveStartDate, collectiveEndDate);
            
            // Optimistically update UI
            setEmployees(prev =>
                prev.map(emp =>
                    employeeIds.includes(emp.id)
                        ? { ...emp, koperasiLimitStartDate: collectiveStartDate, koperasiLimitEndDate: collectiveEndDate }
                        : emp
                )
            );
            
            toast({ title: 'Sukses!', description: 'Periode limit telah diterapkan pada karyawan yang difilter.' });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Gagal menerapkan periode kolektif.' });
        }
    });
  };

  const DatePicker = ({ date, setDate }: { date: Date | undefined, setDate: (date: Date | undefined) => void }) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal h-9', !date && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pilih tanggal</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
        </Popover>
    );
  };


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
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Project" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Proyek</SelectItem>
                    {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Position" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Jabatan</SelectItem>
                    {positions.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Card className="mb-6 bg-muted/50">
            <CardHeader><CardTitle className="text-lg">Pengaturan Periode Kolektif</CardTitle></CardHeader>
            <CardContent className="flex flex-col md:flex-row items-end gap-4">
                <div className="space-y-2 flex-1">
                    <Label>Tanggal Mulai Kolektif</Label>
                    <DatePicker date={collectiveStartDate} setDate={setCollectiveStartDate} />
                </div>
                <div className="space-y-2 flex-1">
                    <Label>Tanggal Selesai Kolektif</Label>
                    <DatePicker date={collectiveEndDate} setDate={setCollectiveEndDate} />
                </div>
                <Button onClick={handleApplyCollectivePeriod} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Check className="mr-2 h-4 w-4" /> Terapkan ke Semua ({filteredEmployees.length})
                </Button>
            </CardContent>
        </Card>

        <div className="overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[250px]">Nama Karyawan</TableHead>
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
                  <TableCell>{emp.positions?.join(', ') || 'N/A'}</TableCell>
                   <TableCell className="w-[200px]">
                     <Input
                        type="number"
                        placeholder="e.g. 500000"
                        value={emp.koperasiLimit || ''}
                        onChange={(e) => handleValueChange(emp.id, 'koperasiLimit', e.target.value)}
                      />
                  </TableCell>
                  <TableCell className="w-[200px]">
                      {formatDate(emp.koperasiLimitStartDate)}
                  </TableCell>
                  <TableCell className="w-[200px]">
                      {formatDate(emp.koperasiLimitEndDate)}
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleSaveLimit(emp.id)} size="sm" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Limit
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
        </div>
      </CardContent>
    </Card>
  );
}
