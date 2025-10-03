
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { createPosition } from '@/actions/positions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSites } from '@/actions/sites';
import type { Site } from '@/lib/types';


type AllowanceField = {
    id: number;
};

export default function NewPositionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [salaryType, setSalaryType] = useState<string | undefined>();
    const [allowances, setAllowances] = useState<AllowanceField[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    
    useEffect(() => {
        const fetchSites = async () => {
            const siteData = await getSites();
            setSites(siteData);
        };
        fetchSites();
    }, []);

    const addAllowance = () => {
        setAllowances([...allowances, { id: Date.now() }]);
    };

    const removeAllowance = (id: number) => {
        setAllowances(allowances.filter(a => a.id !== id));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (data.projectName === '_none_') {
            data.projectName = '';
        }

        try {
            await createPosition(data);
            toast({
                title: 'Success!',
                description: 'Jabatan baru telah ditambahkan.',
            });
            router.push('/dashboard/position');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Gagal menambahkan jabatan baru.',
            });
        } finally {
            setLoading(false);
        }
    };

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
          <CardTitle>Tambah Jabatan Baru</CardTitle>
          <CardDescription>
            Isi formulir di bawah ini untuk menambahkan jabatan baru dan menentukan struktur gajinya.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama Jabatan</Label>
                    <Input id="name" name="name" placeholder="e.g. Software Engineer" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="projectName">Nama Proyek</Label>
                    <Select name="projectName">
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
                              <SelectItem value="jam">Gaji per Jam</SelectItem>
                              <SelectItem value="harian">Gaji Harian</SelectItem>
                              <SelectItem value="bulanan">Gaji Bulanan</SelectItem>
                              <SelectItem value="direksi">Direksi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {salaryType === 'jam' && (
                          <div className="rounded-md border p-4">
                            <div className="space-y-2">
                              <Label htmlFor="hourlyRate">Upah per Jam (Rp)</Label>
                              <Input id="hourlyRate" name="hourlyRate" type="number" placeholder="e.g. 20000" />
                            </div>
                          </div>
                        )}
                        
                        {salaryType === 'harian' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border p-4">
                            <div className="space-y-2">
                              <Label htmlFor="dailyWage">Upah Harian (Rp)</Label>
                              <Input id="dailyWage" name="dailyWage" type="number" placeholder="e.g. 150000" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="overtimeRate">Lembur per Jam (Rp)</Label>
                              <Input id="overtimeRate" name="overtimeRate" type="number" placeholder="e.g. 25000" />
                            </div>
                          </div>
                        )}

                        {(salaryType === 'bulanan' || salaryType === 'direksi') && (
                           <div className="space-y-4 rounded-md border p-4">
                            <div className="space-y-2">
                              <Label htmlFor="monthlySalary">Gaji Pokok Bulanan (Rp)</Label>
                              <Input id="monthlySalary" name="monthlySalary" type="number" placeholder="e.g. 4500000" />
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
                                                placeholder="e.g. Tunjangan Jabatan"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor={`allowanceAmount-${index}`} className="text-xs">Jumlah (Rp)</Label>
                                            <Input
                                                id={`allowanceAmount-${index}`}
                                                name={`allowanceAmount-${index}`}
                                                type="number"
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
                        Simpan Jabatan
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
