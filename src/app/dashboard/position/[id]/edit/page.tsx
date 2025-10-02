
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, WalletCards, PlusCircle, Trash2 } from 'lucide-react';
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
import type { Position, Allowance, Site } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSites } from '@/actions/sites';

type AllowanceField = {
    id: number;
    name: string;
    amount: number;
};

export default function EditPositionPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [position, setPosition] = useState<Position | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [salaryType, setSalaryType] = useState<string | undefined>();
    const [allowances, setAllowances] = useState<AllowanceField[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    
    const id = params.id as string;

    const addAllowance = () => {
        setAllowances([...allowances, { id: Date.now(), name: '', amount: 0 }]);
    };

    const removeAllowance = (id: number) => {
        setAllowances(allowances.filter(a => a.id !== id));
    };

    const handleAllowanceChange = (id: number, field: 'name' | 'amount', value: string | number) => {
        setAllowances(allowances.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    useEffect(() => {
        if (id) {
            const fetchPosition = async () => {
                setPageLoading(true);
                try {
                    const [data, siteData] = await Promise.all([
                        getPosition(id),
                        getSites(),
                    ]);
                    setSites(siteData);
                    if (data) {
                        setPosition(data);
                        setSalaryType(data.salaryType);
                        if (data.allowances) {
                           setAllowances(data.allowances.map((a, i) => ({ ...a, id: Date.now() + i })));
                        }
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
        
        // Manual override for dynamic allowances
        const finalData = { ...data };
        allowances.forEach((allowance, index) => {
            finalData[`allowanceName-${index}`] = allowance.name;
            finalData[`allowanceAmount-${index}`] = allowance.amount.toString();
        });

        if (finalData.projectName === '_none_') {
            finalData.projectName = '';
        }

        try {
            await updatePosition(id, finalData);
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
                    <Input id="name" name="name" defaultValue={position.name ?? ''} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="projectName">Nama Proyek</Label>
                    <Select name="projectName" defaultValue={position.projectName || '_none_'}>
                        <SelectTrigger id="projectName">
                            <SelectValue placeholder="Pilih Proyek" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_none_">Tidak ada</SelectItem>
                            {sites.map((site) => (
                                <SelectItem key={site.id} value={site.name}>{site.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2 md:col-span-3">
                 <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><WalletCards /> Detail Gaji</CardTitle>
                      <CardDescription>Pilih tipe gaji dan isi komponennya.</CardDescription>
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
                              <Input id="dailyWage" name="dailyWage" type="number" placeholder="e.g. 150000" defaultValue={position.dailyWage ?? ''} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="overtimeRate">Lembur per Jam (Rp)</Label>
                              <Input id="overtimeRate" name="overtimeRate" type="number" placeholder="e.g. 25000" defaultValue={position.overtimeRate ?? ''} />
                            </div>
                          </div>
                        )}

                        {(salaryType === 'bulanan' || salaryType === 'direksi') && (
                           <div className="space-y-4 rounded-md border p-4">
                            <div className="space-y-2">
                              <Label htmlFor="monthlySalary">Gaji Pokok Bulanan (Rp)</Label>
                              <Input id="monthlySalary" name="monthlySalary" type="number" placeholder="e.g. 4500000" defaultValue={position.monthlySalary ?? ''} />
                            </div>
                          </div>
                        )}
                        
                        {(salaryType === 'bulanan' || salaryType === 'direksi') && (
                            <div className="space-y-4">
                                <Label>Tunjangan</Label>
                                <div className="space-y-4">
                                {allowances.map((allowance, index) => (
                                    <div key={allowance.id} className="flex items-end gap-2 p-2 border rounded-md">
                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor={`allowanceName-${index}`} className="text-xs">Nama Tunjangan</Label>
                                            <Input
                                                id={`allowanceName-${index}`}
                                                name={`allowanceName-${index}`}
                                                value={allowance.name}
                                                onChange={(e) => handleAllowanceChange(allowance.id, 'name', e.target.value)}
                                                placeholder="e.g. Tunjangan Jabatan"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor={`allowanceAmount-${index}`} className="text-xs">Jumlah (Rp)</Label>
                                            <Input
                                                id={`allowanceAmount-${index}`}
                                                name={`allowanceAmount-${index}`}
                                                type="number"
                                                value={allowance.amount}
                                                onChange={(e) => handleAllowanceChange(allowance.id, 'amount', Number(e.target.value))}
                                                placeholder="e.g. 500000"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => removeAllowance(allowance.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addAllowance}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Tambah Tunjangan
                                </Button>
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
