'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Calendar as CalendarIcon } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createFinanceRecord } from '@/actions/finance';
import { getSites } from '@/actions/sites';
import type { Site } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function NewFinanceRecordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Site[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const fetchProjects = async () => {
      const siteData = await getSites();
      setProjects(siteData);
    };
    fetchProjects();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const projectId = formData.get('projectId') as string;
    const project = projects.find(p => p.id === projectId);

    if (!project || !date) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Project dan Tanggal harus diisi.',
      });
      setLoading(false);
      return;
    }

    const recordData = {
      projectId: project.id,
      projectName: project.name,
      type: formData.get('type') as 'income' | 'expense',
      amount: parseFloat(formData.get('amount') as string),
      description: formData.get('description') as string,
      date,
    };

    try {
      await createFinanceRecord(recordData);
      toast({
        title: 'Sukses!',
        description: 'Catatan keuangan baru telah ditambahkan.',
      });
      router.push('/dashboard/finance');
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menambahkan catatan keuangan baru.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/finance">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Keuangan
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Catatan Keuangan Baru</CardTitle>
          <CardDescription>
            Isi formulir untuk menambah catatan pemasukan atau pengeluaran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="projectId">Proyek</Label>
                <Select name="projectId" required>
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="Pilih Proyek" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div className="space-y-2">
                <Label>Tipe Transaksi</Label>
                <RadioGroup name="type" defaultValue="expense" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="type-expense" />
                    <Label htmlFor="type-expense">Pengeluaran</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="type-income" />
                    <Label htmlFor="type-income">Pemasukan</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah (Rp)</Label>
                <Input id="amount" name="amount" type="number" placeholder="e.g. 500000" required />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                 <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" name="description" placeholder="e.g. Pembelian material" required />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Catatan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
