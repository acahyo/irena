'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, PlusCircle, Trash2 } from 'lucide-react';
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
import { getSite, updateSite } from '@/actions/sites';
import { getEmployees } from '@/actions/employees';
import type { Site, Employee } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';


export default function EditProjectPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [site, setSite] = useState<Site | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    
    const id = params.id as string;

    const [picId, setPicId] = useState<string | undefined>();
    const [picContact, setPicContact] = useState<string | undefined>('');
    const [supervisors, setSupervisors] = useState<{ id: string, name: string }[]>([]);
    const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');

    useEffect(() => {
        const fetchInitialData = async () => {
            setPageLoading(true);
            try {
                const [siteData, employeeData] = await Promise.all([
                    getSite(id),
                    getEmployees()
                ]);

                if (siteData) {
                    setSite(siteData);
                    setPicId(siteData.picId);
                    setPicContact(siteData.picContact);
                    setSupervisors(siteData.supervisors || []);
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Proyek tidak ditemukan.',
                    });
                    router.push('/dashboard/project');
                }
                setEmployees(employeeData);
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Gagal mengambil data.',
                });
            } finally {
                setPageLoading(false);
            }
        };
        
        if(id) {
            fetchInitialData();
        }
    }, [id, router, toast]);

    const handlePicChange = (employeeId: string) => {
        const selectedEmployee = employees.find(emp => emp.id === employeeId);
        setPicId(employeeId);
        setPicContact(selectedEmployee?.phone || '');
    };

    const addSupervisor = () => {
        const supervisor = employees.find(e => e.id === selectedSupervisor);
        if (supervisor && !supervisors.some(s => s.id === supervisor.id)) {
            setSupervisors(prev => [...prev, { id: supervisor.id, name: supervisor.name }]);
            setSelectedSupervisor('');
        }
    };
    
    const removeSupervisor = (supervisorId: string) => {
        setSupervisors(prev => prev.filter(s => s.id !== supervisorId));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!site) return;

        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const selectedPic = employees.find(e => e.id === picId);

        const siteData: Partial<Site> = {
            name,
            picId,
            picName: selectedPic?.name,
            picContact: selectedPic?.phone,
            supervisors,
        };

        try {
            await updateSite(id, siteData);
            toast({
                title: 'Success!',
                description: 'Proyek telah diperbarui.',
            });
            router.push('/dashboard/project');
            router.refresh();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Gagal memperbarui proyek.',
            });
        } finally {
            setLoading(false);
        }
    };

  if (pageLoading || !site) {
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
            <Link href="/dashboard/project">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Proyek
            </Link>
        </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Proyek</CardTitle>
          <CardDescription>
            Perbarui detail proyek di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Proyek/Site</Label>
                        <Input id="name" name="name" defaultValue={site.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pic">Nama PIC</Label>
                        <Select value={picId} onValueChange={handlePicChange}>
                        <SelectTrigger id="pic">
                            <SelectValue placeholder="Pilih PIC" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="picContact">Nomor Kontak PIC</Label>
                        <Input id="picContact" name="picContact" value={picContact} readOnly disabled />
                    </div>
                </div>

                <div className="space-y-4">
                    <Label>Pengawas</Label>
                    <div className="flex items-center gap-2">
                        <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih Pengawas untuk ditambahkan" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.filter(e => !supervisors.some(s => s.id === e.id)).map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <Button type="button" onClick={addSupervisor} disabled={!selectedSupervisor}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                        {supervisors.map(s => (
                        <Badge key={s.id} variant="secondary" className="flex items-center gap-2">
                            {s.name}
                            <button type="button" onClick={() => removeSupervisor(s.id)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                            <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                        </Badge>
                        ))}
                        {supervisors.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pengawas ditambahkan.</p>}
                    </div>
                </div>

                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Perbarui Proyek
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
