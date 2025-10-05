

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Calendar as CalendarIcon, Upload, Loader2, FileIcon, AlertTriangle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { HseCategory, Employee, Department, Position, Site } from '@/lib/types';
import { createHseRecord } from '@/actions/hse';
import { getEmployees } from '@/actions/employees';
import { getDepartments } from '@/actions/departments';
import { getPositions } from '@/actions/positions';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getViolationRecords } from '@/actions/violations';
import { differenceInMonths } from 'date-fns';
import { getSites } from '@/actions/sites';
import { useUser } from '@/contexts/user-context';


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
  const [fineFilePreview, setFineFilePreview] = useState<string | null>(null);
  const user = useUser();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allViolations, setAllViolations] = useState<ViolationRecord[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [positionFilter, setPositionFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [hasFine, setHasFine] = useState(false);
  
  const category = searchParams.get('category') as HseCategory | null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (category === 'incident') {
        try {
          const userSiteIds = (user?.role === 'Admin Proyek' && user.siteIds) ? user.siteIds : undefined;

          const [empData, vioData, posData, siteData] = await Promise.all([
            getEmployees({ siteIds: userSiteIds }),
            getViolationRecords(),
            getPositions(),
            getSites(),
          ]);
          setEmployees(empData);
          setAllViolations(vioData);
          setPositions(posData);
          setSites(siteData);
        } catch (error) {
           toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat data.'});
        }
      }
      setLoading(false);
    };
    if (user) {
        fetchData();
    }
  }, [category, toast, user]);
  
  const filteredEmployees = useMemo(() => {
      return employees.filter(emp => 
        (siteFilter === 'all' || emp.siteLocation === siteFilter) &&
        (positionFilter === 'all' || emp.positions?.includes(positionFilter))
      );
  }, [employees, siteFilter, positionFilter]);


  const filteredPositions = useMemo(() => {
    if (siteFilter === 'all') {
      const generalPositions = positions.filter(p => !p.projectName);
      return generalPositions;
    }
    const selectedSite = sites.find(s => s.name === siteFilter);
    if (!selectedSite) return [];

    return positions.filter(p => !p.projectName || p.projectName === selectedSite.name);
  }, [positions, siteFilter, sites]);
  
  const getNextStatus = (currentStatus: ViolationRecord['status']): ViolationRecord['status'] => {
    switch (currentStatus) {
        case 'SP1': return 'SP2';
        case 'SP2': return 'SP3';
        case 'SP3': return 'SPPT';
        case 'SPPT': return 'SPPT';
        default: return 'SP1';
    }
  }

  const lastViolation = useMemo(() => {
    if (!selectedEmployee) return null;
    return allViolations
      .filter(v => v.employeeId === selectedEmployee.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [selectedEmployee, allViolations]);
  
  const recommendation = useMemo(() => {
    if (!lastViolation) return { recommended: 'SP1' as const, message: 'Ini adalah pelanggaran pertama yang tercatat untuk karyawan ini.' };
    
    const lastViolationDate = new Date(lastViolation.date);
    const monthsSinceLast = differenceInMonths(new Date(), lastViolationDate);

    if (monthsSinceLast < 6) {
        const nextStatus = getNextStatus(lastViolation.status);
        return {
            recommended: nextStatus,
            message: `Karyawan ini memiliki ${lastViolation.status} aktif yang diberikan pada ${format(lastViolationDate, 'PPP')}.`,
        };
    }
    
    return { recommended: 'SP1' as const, message: 'Pelanggaran terakhir sudah lebih dari 6 bulan yang lalu.' };

  }, [lastViolation]);


  if (!category || !categoryTitles[category]) {
      return (
          <div>
              <p>Kategori tidak valid. Silakan kembali ke halaman HSE dan coba lagi.</p>
              <Button asChild variant="link"><Link href="/dashboard/hse">Kembali</Link></Button>
          </div>
      );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setter(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setter(null);
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
    
    
    const recordData: Omit<ViolationRecord, 'id'> = {
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        employeePosition: selectedEmployee.positions?.join(', ') || 'N/A',
        siteLocation: selectedEmployee.siteLocation || 'N/A',
        category,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        date,
        fileUrl: filePreview || undefined,
        status: formData.get('status') as 'SP1' | 'SP2' | 'SP3' | 'SPPT',
        // Incident-specific fields
        hasFine: hasFine,
        fineAmount: formData.get('fineAmount') ? Number(formData.get('fineAmount')) : undefined,
        fineAttachmentUrl: fineFilePreview || undefined,
    };
    
    try {
        await createHseRecord(recordData as any); // Cast to any to bypass type mismatch on server
        toast({
            title: 'Sukses!',
            description: 'Data HSE baru telah ditambahkan.',
        });
        router.push('/dashboard/violations');
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

  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    setSelectedEmployee(emp || null);
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Filter Proyek</Label>
                    <Select value={siteFilter} onValueChange={(value) => { setSiteFilter(value); setPositionFilter('all'); setSelectedEmployee(null);}}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Proyek</SelectItem>
                            {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Filter Jabatan</Label>
                    <Select value={positionFilter} onValueChange={(value) => { setPositionFilter(value); setSelectedEmployee(null); }} disabled={siteFilter === 'all'}>
                        <SelectTrigger><SelectValue placeholder={siteFilter === 'all' ? 'Pilih proyek dulu' : 'Semua Jabatan'}/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Jabatan</SelectItem>
                            {filteredPositions.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
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

              {category === 'incident' && (
                <>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="employeeId">Nama Karyawan</Label>
                        <Select name="employeeId" onValueChange={handleEmployeeChange}>
                             <SelectTrigger id="employeeId"><SelectValue placeholder="Pilih Karyawan" /></SelectTrigger>
                            <SelectContent>
                                {filteredEmployees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
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

                     <div className="space-y-2 flex items-center gap-2 pt-2">
                        <Checkbox id="hasFine" name="hasFine" checked={hasFine} onCheckedChange={(checked) => setHasFine(!!checked)} />
                        <Label htmlFor="hasFine">Ada Denda Terkait Insiden Ini?</Label>
                    </div>
                </>
              )}

             {category === 'incident' && hasFine && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-l-4 border-destructive pl-4">
                    <div className="space-y-2">
                        <Label htmlFor="fineAmount">Nominal Denda (Rp)</Label>
                        <Input id="fineAmount" name="fineAmount" type="number" placeholder="e.g. 50000" required={hasFine} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="fineAttachment">Lampiran Bukti Denda</Label>
                         <div className="flex items-center gap-4">
                            {fineFilePreview && (
                                <div className="flex items-center gap-2 border p-2 rounded-md bg-muted">
                                   <FileIcon className="h-6 w-6" />
                                   <span className="text-sm text-muted-foreground">File dipilih</span>
                                </div>
                            )}
                            <Input
                                id="fineAttachment"
                                name="fineAttachment"
                                type="file"
                                onChange={(e) => handleFileChange(e, setFineFilePreview)}
                                className="max-w-sm"
                                required={hasFine}
                            />
                        </div>
                    </div>
                </div>
             )}


              <div className="space-y-2 md:col-span-2">
                 <Label htmlFor="description">Deskripsi / Ringkasan</Label>
                <Textarea id="description" name="description" placeholder="Jelaskan detail laporan atau dokumen di sini..." required />
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
                    <Input
                        id="file"
                        name="file"
                        type="file"
                        onChange={(e) => handleFileChange(e, setFilePreview)}
                        className="max-w-sm"
                        required
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
