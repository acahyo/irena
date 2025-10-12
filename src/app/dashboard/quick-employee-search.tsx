
'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Employee, ViolationRecord } from '@/lib/types';
import { Search, Loader2, FileText, AlertTriangle, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const getStatusVariant = (status: ViolationRecord['status']) => {
  switch (status) {
    case 'SP1': return 'default';
    case 'SP2': return 'secondary';
    case 'SP3': return 'destructive';
    case 'SPPT': return 'outline';
    default: return 'outline';
  }
};

const getEmployeeStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
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


export default function QuickEmployeeSearch({
  employees,
  violations,
}: {
  employees: Employee[];
  violations: ViolationRecord[];
}) {
  const [nik, setNik] = useState('');
  const [isSearching, startSearch] = useTransition();
  const { toast } = useToast();
  const [searchResult, setSearchResult] = useState<{
    employee: Employee;
    violations: ViolationRecord[];
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  

  const handleSearch = () => {
    if (!nik) {
      toast({ variant: 'destructive', title: 'Error', description: 'NIK wajib diisi.' });
      return;
    }
    startSearch(() => {
      const foundEmployee = employees.find(e => e.nik === nik);
      if (!foundEmployee) {
        toast({ variant: 'destructive', title: 'Tidak Ditemukan', description: 'Karyawan dengan NIK tersebut tidak ditemukan.' });
        setSearchResult(null);
        return;
      }
      
      const employeeViolations = violations
        .filter(v => v.employeeId === foundEmployee.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setSearchResult({ employee: foundEmployee, violations: employeeViolations });
      setIsDialogOpen(true);
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cek Cepat Karyawan</CardTitle>
          <CardDescription>Cari ringkasan informasi karyawan berdasarkan NIK.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="text"
              placeholder="Masukkan NIK Karyawan..."
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {searchResult && (
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Ringkasan Karyawan: {searchResult.employee.name}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                    <div className="md:col-span-1 space-y-4">
                       <Avatar className="h-24 w-24 border">
                            <AvatarImage src={searchResult.employee.avatar} alt={searchResult.employee.name} />
                            <AvatarFallback>{searchResult.employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{searchResult.employee.name}</p>
                            <p className="text-sm text-muted-foreground">NIK: {searchResult.employee.nik}</p>
                            <p className="text-sm text-muted-foreground">Jabatan: {searchResult.employee.positions?.join(', ') || 'N/A'}</p>
                             <p className="text-sm text-muted-foreground">Departemen: {searchResult.employee.department || 'N/A'}</p>
                             <div className="text-sm text-muted-foreground mt-2">
                                Status: <Badge variant={getEmployeeStatusVariant(searchResult.employee.employeeStatus)} className="capitalize">{searchResult.employee.employeeStatus}</Badge>
                             </div>
                        </div>
                        <Separator />
                         <Button asChild variant="outline" className="w-full">
                            <Link href={`/dashboard/employees/${searchResult.employee.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Lihat Profil Lengkap
                            </Link>
                        </Button>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="font-semibold mb-2">Riwayat Pelanggaran</h4>
                        <ScrollArea className="h-72 pr-4">
                           <div className="space-y-3">
                                {searchResult.violations.length > 0 ? (
                                    searchResult.violations.map(v => (
                                        <div key={v.id} className="border p-3 rounded-md text-sm">
                                            <div className="flex justify-between items-center">
                                                <Badge variant={getStatusVariant(v.status)}>{v.status}</Badge>
                                                <span className="text-xs text-muted-foreground">{format(new Date(v.date), 'PPP')}</span>
                                            </div>
                                            <p className="mt-2 text-muted-foreground">{v.description}</p>
                                            {v.fileUrl && <a href={v.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"><FileText className="h-3 w-3" />Lihat Dokumen</a>}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                        <AlertTriangle className="h-8 w-8 mb-2" />
                                        <p>Tidak ada riwayat pelanggaran ditemukan.</p>
                                    </div>
                                )}
                           </div>
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Tutup</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
          )}
      </Dialog>
    </>
  );
}
