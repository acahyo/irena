
'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, Trash2, Pencil, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ViolationRecord, Employee, Site } from '@/lib/types';
import { deleteViolationRecord } from '@/actions/violations';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const getStatusVariant = (status: ViolationRecord['status']) => {
  switch (status) {
    case 'SP1': return 'default';
    case 'SP2': return 'secondary';
    case 'SP3': return 'destructive';
    case 'SPPT': return 'outline';
    default: return 'outline';
  }
};

export default function ViolationsClientPage({
  initialRecords,
  employees,
  sites,
}: {
  initialRecords: ViolationRecord[];
  employees: Employee[];
  sites: Site[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [nameFilter, setNameFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');

  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchesName = nameFilter === '' || rec.employeeName.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesSite = siteFilter === 'all' || rec.siteLocation === siteFilter;
      return matchesName && matchesSite;
    });
  }, [records, nameFilter, siteFilter]);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteViolationRecord(id);
        setRecords(prev => prev.filter(r => r.id !== id));
        toast({ title: 'Sukses!', description: 'Catatan pelanggaran telah dihapus.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus catatan.' });
      }
    });
  };

  const handleExport = () => {
    const dataToExport = filteredRecords.map(rec => ({
      'Tanggal': format(new Date(rec.date), 'yyyy-MM-dd'),
      'Nama Karyawan': rec.employeeName,
      'Jabatan': rec.employeePosition,
      'Lokasi Proyek': rec.siteLocation,
      'Status Pelanggaran': rec.status,
      'Deskripsi': rec.description,
      'URL File': rec.fileUrl,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Catatan Pelanggaran');
    XLSX.writeFile(workbook, 'rekap_pelanggaran_karyawan.xlsx');
    toast({ title: 'Sukses!', description: 'Data telah diekspor ke file Excel.' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Rekap Catatan Pelanggaran</CardTitle>
            <CardDescription>Kelola dan pantau surat peringatan (SP) karyawan.</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Filter nama..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full sm:w-auto"
            />
             <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter Proyek" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Proyek</SelectItem>
                    {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4"/>Ekspor</Button>
            <Button asChild><Link href="/dashboard/violations/new"><PlusCircle className="mr-2 h-4 w-4" /> Tambah Catatan</Link></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Karyawan</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Proyek</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-medium">{rec.employeeName}</TableCell>
                  <TableCell>{rec.employeePosition}</TableCell>
                  <TableCell>{rec.siteLocation}</TableCell>
                  <TableCell>{format(new Date(rec.date), 'PPP')}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(rec.status)}>{rec.status}</Badge></TableCell>
                  <TableCell>
                    {rec.fileUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={rec.fileUrl} target="_blank" rel="noopener noreferrer">
                          Lihat <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/violations/${rec.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
                          <AlertDialogDescription>Aksi ini tidak dapat dibatalkan. Catatan pelanggaran akan dihapus permanen.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(rec.id)} disabled={isPending}>Lanjutkan</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">Tidak ada data ditemukan.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
