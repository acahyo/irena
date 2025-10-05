
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Loader2, Calendar as CalendarIcon, Upload, FileIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getViolationRecords, updateViolationRecord } from '@/actions/violations';
import { getEmployees } from '@/actions/employees';
import type { Employee, ViolationRecord } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditViolationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  
  const [record, setRecord] = useState<ViolationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>();
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      setPageLoading(true);
      try {
        const records = await getViolationRecords();
        const foundRecord = records.find(r => r.id === id);
        if (foundRecord) {
          setRecord(foundRecord);
          setDate(new Date(foundRecord.date));
          setFilePreview(foundRecord.fileUrl || null);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Catatan pelanggaran tidak ditemukan.' });
          router.push('/dashboard/violations');
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengambil data catatan.' });
      } finally {
        setPageLoading(false);
      }
    };
    if (id) {
      fetchRecord();
    }
  }, [id, router, toast]);
  
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
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!record || !date) return;
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const updates: Partial<Omit<ViolationRecord, 'id'>> = {
      date,
      status: formData.get('status') as ViolationRecord['status'],
      description: formData.get('description') as string,
      fileUrl: filePreview || undefined,
    };

    try {
      await updateViolationRecord(id, updates);
      toast({ title: 'Sukses!', description: 'Catatan pelanggaran telah diperbarui.' });
      router.push('/dashboard/violations');
      router.refresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui catatan.' });
    } finally {
      setLoading(false);
    }
  };
  
  if (pageLoading || !record) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-40" />
            <Card><CardHeader><Skeleton className="h-8 w-60" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/violations"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Pelanggaran</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Catatan Pelanggaran</CardTitle>
          <CardDescription>Perbarui detail untuk {record.employeeName}.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Karyawan</Label>
                <Input value={record.employeeName} disabled />
              </div>
              
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
                <Select name="status" defaultValue={record.status} required>
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
                <Textarea id="description" name="description" defaultValue={record.description} required />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="file">Lampiran File (Opsional)</Label>
                <div className="flex items-center gap-4">
                  {filePreview && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={filePreview} target="_blank" rel="noopener noreferrer">
                        Lihat File <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <Input id="file" name="file" type="file" onChange={handleFileChange} className="max-w-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Batal</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Perbarui Catatan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
