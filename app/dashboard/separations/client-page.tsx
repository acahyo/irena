

'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Employee, Site } from '@/lib/types';
import { updateEmployee } from '@/actions/employees';
import { Loader2, UserMinus, Calendar as CalendarIcon, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/contexts/user-context';
import { Badge } from '@/components/ui/badge';


const getStatusVariant = (status?: string) => {
  switch (status) {
    case 'active':
      return 'default';
    case 'nonaktif':
    case 'Pending PHK Approval':
      return 'secondary';
    case 'resign':
      return 'outline';
    case 'phk':
      return 'destructive';
    default:
      return 'secondary';
  }
};


export default function SeparationsClientPage({
  initialEmployees,
  sites,
}: {
  initialEmployees: Employee[];
  sites: Site[];
}) {
  const [siteFilter, setSiteFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [separationType, setSeparationType] = useState<'resign' | 'phk'>('resign');
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>();
  const [document, setDocument] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const user = useUser();

  const filteredEmployees = useMemo(() => {
    if (siteFilter === 'all') {
      return initialEmployees;
    }
    return initialEmployees.filter(emp => emp.siteLocation === sites.find(s => s.id === siteFilter)?.name);
  }, [initialEmployees, siteFilter, sites]);

  const handleProcessClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSeparationType('resign');
    setEffectiveDate(undefined);
    setDocument(null);
    setReason('');
    setIsDialogOpen(true);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDocument(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedEmployee || !effectiveDate) {
      toast({ variant: 'destructive', title: 'Error', description: 'Mohon lengkapi semua kolom yang diperlukan.' });
      return;
    }

    startTransition(async () => {
      try {
        let finalStatus: Employee['employeeStatus'] = separationType;
        
        // HR/Admin can directly process PHK. Others need approval.
        if (separationType === 'phk' && user?.role !== 'HR' && user?.role !== 'Administrator') {
            finalStatus = 'Pending PHK Approval';
        }

        const updateData: Partial<Employee> = {
          employeeStatus: finalStatus,
          contractEndDate: effectiveDate,
          separationReason: reason,
          // In a real scenario, you'd save the document URL to a new collection
        };

        await updateEmployee(selectedEmployee.id, updateData);

        toast({ title: 'Sukses!', description: `Status karyawan ${selectedEmployee.name} telah diperbarui.` });
        setIsDialogOpen(false);
        router.refresh();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal memproses karyawan.' });
      }
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Proses Resign / PHK Karyawan</CardTitle>
          <CardDescription>Pilih karyawan untuk mengubah status menjadi resign atau PHK.</CardDescription>
          <div className="pt-4">
             <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-full md:w-[280px]">
                    <SelectValue placeholder="Filter Berdasarkan Proyek" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Proyek</SelectItem>
                    {sites.map(site => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Proyek</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={employee.avatar} alt={employee.name} />
                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{employee.positions?.join(', ') || 'N/A'}</TableCell>
                  <TableCell>{employee.siteLocation}</TableCell>
                   <TableCell>
                    <Badge variant={getStatusVariant(employee.employeeStatus)} className="capitalize">
                      {employee.employeeStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleProcessClick(employee)} disabled={employee.employeeStatus !== 'active'}>
                      <UserMinus className="mr-2 h-4 w-4" /> Proses
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Tidak ada karyawan di proyek ini.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Karyawan Keluar: {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>Pilih tipe, tanggal efektif, dan lampirkan dokumen pendukung.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="separation-type">Tipe Proses</Label>
              <Select value={separationType} onValueChange={(v) => setSeparationType(v as any)}>
                <SelectTrigger id="separation-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="resign">Resign (Pengunduran Diri)</SelectItem>
                  <SelectItem value="phk">PHK (Pemutusan Hubungan Kerja)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="effective-date">Tanggal Efektif</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !effectiveDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {effectiveDate ? format(effectiveDate, 'PPP') : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={effectiveDate} onSelect={setEffectiveDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Alasan (Singkat)</Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">Dokumen Pendukung</Label>
              <Input id="document" type="file" onChange={handleFileChange} />
              {document && <p className="text-xs text-muted-foreground">File dipilih. Klik "Proses" untuk mengunggah.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Proses Karyawan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
