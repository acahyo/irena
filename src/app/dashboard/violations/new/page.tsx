
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInMonths, addMonths } from 'date-fns';
import { ArrowLeft, Loader2, Calendar as CalendarIcon, Upload, FileIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { createViolationRecord, getViolationRecords } from '@/actions/violations';
import { getEmployees } from '@/actions/employees';
import type { Employee, ViolationRecord } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const getNextStatus = (currentStatus: ViolationRecord['status']): ViolationRecord['status'] => {
    switch (currentStatus) {
        case 'SP1': return 'SP2';
        case 'SP2': return 'SP3';
        case 'SP3': return 'SPPT';
        case 'SPPT': return 'SPPT';
        default: return 'SP1';
    }
}

export default function NewViolationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allViolations, setAllViolations] = useState<ViolationRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const lastViolation = useMemo(() => {
    if (!selectedEmployee) return null;
    return allViolations
      .filter(v => v.employeeId === selectedEmployee.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [selectedEmployee, allViolations]);
  
  const recommendation = useMemo(() => {
    if (!lastViolation) return { recommended: 'SP1', message: 'Ini adalah pelanggaran pertama yang tercatat untuk karyawan ini.' };
    
    const lastViolationDate = new Date(lastViolation.date);
    const monthsSinceLast = differenceInMonths(new Date(), lastViolationDate);

    if (monthsSinceLast < 6) {
        const nextStatus = getNextStatus(lastViolation.status);
        return {
            recommended: nextStatus,
            message: `Karyawan ini memiliki ${lastViolation.status} aktif yang diberikan pada ${format(lastViolationDate, 'PPP')}.`,
        };
    }
    
    return { recommended: 'SP1', message: 'Pelanggaran terakhir sudah lebih dari 6 bulan yang lalu.' };

  }, [lastViolation]);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [emps, violations] = await Promise.all([getEmployees(), getViolationRecords()]);
        setEmployees(emps);
        setAllViolations(violations);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat data karyawan atau riwayat pelanggaran.'});
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    setSelectedEmployee(emp || null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: 'destructive', title: 'File terlalu besar', description: 'Ukuran file tidak boleh melebihi 2MB.' });
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEmployee || !date) {
      toast({ variant: 'destructive', title: 'Error', description: 'Karyawan dan Tanggal wajib diisi.' });
      return;
    }
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const recordData = {
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      employeePosition: selectedEmployee.positions?.join(', ') || 'N/A',
      siteLocation: selectedEmployee.siteLocation || 'N/A',
      date,
      status: formData.get('status') as 'SP1' | 'SP2' | 'SP3' | 'SPPT',
      description: formData.get('description') as string,
      fileUrl: filePreview || undefined,
    };

    try {
      await createViolationRecord(recordData);
      toast({ title: 'Sukses!', description: 'Catatan pelanggaran telah ditambahkan.' });
      router.push('/dashboard/violations');
      router.refresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menambahkan catatan.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/violations"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Pelanggaran</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Catatan Pelanggaran Baru</CardTitle>
          <CardDescription>Isi formulir untuk mencatat surat peringatan (SP) karyawan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="employeeId">Karyawan</Label>
                <Select onValueChange={handleEmployeeChange} required>
                  <SelectTrigger id="employeeId"><SelectValue placeholder="Pilih Karyawan" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

               {selectedEmployee && (
                  <div className="md:col-span-2">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Rekomendasi Status Pelanggaran: <span className="font-bold">{recommendation.recommended}</span></AlertTitle>
                        <AlertDescription>
                           {recommendation.message}
                        </AlertDescription>
                      </Alert>
                  </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="date">Tanggal Pelanggaran</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status Pelanggaran</Label>
                <Select name="status" defaultValue={recommendation.recommended} required key={recommendation.recommended}>
                  <SelectTrigger id="status"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP1">SP1</SelectItem>
                    <SelectItem value="SP2">SP2</SelectItem>
                    <SelectItem value="SP3">SP3</SelectItem>
                    <SelectItem value="SPPT">SPPT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Deskripsi Pelanggaran</Label>
                <Textarea id="description" name="description" placeholder="Jelaskan detail pelanggaran di sini..." required />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="file">Lampiran File (Wajib)</Label>
                <div className="flex items-center gap-4">
                  {filePreview && (
                    <div className="flex items-center gap-2 border p-2 rounded-md bg-muted">
                      <FileIcon className="h-6 w-6" />
                      <span className="text-sm text-muted-foreground">File dipilih</span>
                    </div>
                  )}
                  <Input id="file" name="file" type="file" onChange={handleFileChange} className="max-w-sm" required/>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Batal</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Catatan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
