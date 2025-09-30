'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Calendar as CalendarIcon, Upload, Loader2, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { HseCategory } from '@/lib/types';
import { createHseRecord } from '@/actions/hse';
import { Textarea } from '@/components/ui/textarea';


const categoryTitles: Record<HseCategory, string> = {
    incident: 'Laporan Insiden Baru',
    inspection: 'Dokumentasi Inspeksi Baru',
    risk: 'Data Manajemen Risiko Baru',
    plan: 'Rencana Kerja K3 Baru'
};


export default function NewHseRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const category = searchParams.get('category') as HseCategory | null;

  if (!category || !categoryTitles[category]) {
      // Redirect or show an error if category is missing/invalid
      return (
          <div>
              <p>Kategori tidak valid. Silakan kembali ke halaman HSE dan coba lagi.</p>
              <Button asChild variant="link"><Link href="/dashboard/hse">Kembali</Link></Button>
          </div>
      );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!date) {
        toast({ variant: 'destructive', title: 'Error', description: 'Tanggal harus diisi.' });
        setLoading(false);
        return;
    }
    
    try {
        await createHseRecord({
            category,
            title,
            description,
            date,
            fileUrl: filePreview || undefined
        });
        toast({
            title: 'Sukses!',
            description: 'Data HSE baru telah ditambahkan.',
        });
        router.push('/dashboard/hse');
        router.refresh();
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Gagal menambahkan data HSE baru.',
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/hse">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke HSE
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{categoryTitles[category]}</CardTitle>
          <CardDescription>
            Isi formulir untuk menambah data HSE baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <Label htmlFor="title">Judul</Label>
                <Input id="title" name="title" placeholder="e.g. Investigasi Kecelakaan Ringan" required />
              </div>

               <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 md:col-span-2">
                 <Label htmlFor="description">Deskripsi / Ringkasan</Label>
                <Textarea id="description" name="description" placeholder="Jelaskan detail laporan atau dokumen di sini..." required />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="file">Lampiran File (Opsional)</Label>
                 <div className="flex items-center gap-4">
                    {filePreview && (
                        <div className="flex items-center gap-2 border p-2 rounded-md bg-muted">
                           <FileIcon className="h-6 w-6" />
                           <span className="text-sm text-muted-foreground">File dipilih</span>
                        </div>
                    )}
                    <Input
                        id="file"
                        name="file"
                        type="file"
                        onChange={handleFileChange}
                        className="max-w-sm"
                    />
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Data
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}