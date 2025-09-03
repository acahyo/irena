'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, WalletCards } from 'lucide-react';
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
import { getPosition, updatePosition } from '@/actions/positions';
import type { Position } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EditPositionPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [position, setPosition] = useState<Position | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [salaryType, setSalaryType] = useState<string | undefined>();
    
    const id = params.id as string;

    useEffect(() => {
        if (id) {
            const fetchPosition = async () => {
                setPageLoading(true);
                try {
                    const data = await getPosition(id);
                    if (data) {
                        setPosition(data);
                        setSalaryType(data.salaryType);
                    } else {
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Position not found.',
                        });
                        router.push('/dashboard/position');
                    }
                } catch (error) {
                     toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to fetch position data.',
                    });
                } finally {
                    setPageLoading(false);
                }
            };
            fetchPosition();
        }
    }, [id, router, toast]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!position) return;

        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await updatePosition(id, data as Partial<Position>);
            toast({
                title: 'Success!',
                description: 'Jabatan telah diperbarui.',
            });
            router.push('/dashboard/position');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Gagal memperbarui jabatan.',
            });
        } finally {
            setLoading(false);
        }
    };

  if (pageLoading || !position) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-40" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-24" />
                             <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/position">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Jabatan &amp; Gaji
            </Link>
        </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Jabatan</CardTitle>
          <CardDescription>
            Perbarui nama jabatan dan detail gaji terkait di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama Jabatan</Label>
                    <Input id="name" name="name" defaultValue={position.name} required />
                </div>
                 <div className="space-y-2 md:col-span-3">
                 <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><WalletCards /> Detail Gaji</CardTitle>
                      <CardDescription>Pilih tipe gaji dan isi detailnya.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div className="space-y-2">
                          <Label htmlFor="salaryType">Tipe Gaji</Label>
                          <Select name="salaryType" value={salaryType} onValueChange={setSalaryType}>
                            <SelectTrigger id="salaryType">
                              <SelectValue placeholder="Pilih Tipe Gaji" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="harian">Gaji Harian</SelectItem>
                              <SelectItem value="bulanan">Gaji Bulanan</SelectItem>
                              <SelectItem value="direksi">Direksi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {salaryType === 'harian' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border p-4">
                            <div className="space-y-2">
                              <Label htmlFor="dailyWage">Upah Harian (Rp)</Label>
                              <Input id="dailyWage" name="dailyWage" type="number" placeholder="e.g. 150000" defaultValue={position.dailyWage} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="overtimeRate">Lembur per Jam (Rp)</Label>
                              <Input id="overtimeRate" name="overtimeRate" type="number" placeholder="e.g. 25000" defaultValue={position.overtimeRate} />
                            </div>
                          </div>
                        )}

                        {salaryType === 'bulanan' && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border p-4">
                            <div className="space-y-2">
                              <Label htmlFor="monthlySalary">Gaji Bulanan (Rp)</Label>
                              <Input id="monthlySalary" name="monthlySalary" type="number" placeholder="e.g. 4500000" defaultValue={position.monthlySalary} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="otAllowance">Tunjangan OT &amp; Kehadiran (Rp)</Label>
                              <Input id="otAllowance" name="otAllowance" type="number" placeholder="e.g. 500000" defaultValue={position.otAllowance} />
                            </div>
                             <div className="space-y-2">
                              <Label htmlFor="locationAllowance">Tunjangan Lokasi (Rp)</Label>
                              <Input id="locationAllowance" name="locationAllowance" type="number" placeholder="e.g. 300000" defaultValue={position.locationAllowance} />
                            </div>
                             <div className="space-y-2">
                              <Label htmlFor="mealAllowance">Tunjangan Makan (Rp)</Label>
                              <Input id="mealAllowance" name="mealAllowance" type="number" placeholder="e.g. 750000" defaultValue={position.mealAllowance} />
                            </div>
                             <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="otherAllowances">Tunjangan Lain-lain (Rp)</Label>
                              <Input id="otherAllowances" name="otherAllowances" type="number" placeholder="e.g. 200000" defaultValue={position.otherAllowances} />
                            </div>
                          </div>
                        )}

                        {salaryType === 'direksi' && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border p-4">
                            <div className="space-y-2">
                              <Label htmlFor="monthlySalary">Gaji Pokok (Rp)</Label>
                              <Input id="monthlySalary" name="monthlySalary" type="number" placeholder="e.g. 10000000" defaultValue={position.monthlySalary} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tunjanganJabatan">Tunjangan Jabatan (Rp)</Label>
                              <Input id="tunjanganJabatan" name="tunjanganJabatan" type="number" placeholder="e.g. 5000000" defaultValue={position.tunjanganJabatan} />
                            </div>
                             <div className="space-y-2">
                              <Label htmlFor="tunjanganKehadiran">Tunjangan Kehadiran (Rp)</Label>
                              <Input id="tunjanganKehadiran" name="tunjanganKehadiran" type="number" placeholder="e.g. 1000000" defaultValue={position.tunjanganKehadiran} />
                            </div>
                             <div className="space-y-2">
                              <Label htmlFor="tunjanganKinerja">Tunjangan Kinerja (Rp)</Label>
                              <Input id="tunjanganKinerja" name="tunjanganKinerja" type="number" placeholder="e.g. 2000000" defaultValue={position.tunjanganKinerja} />
                            </div>
                          </div>
                        )}

                    </CardContent>
                 </Card>
              </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Perbarui Jabatan
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
