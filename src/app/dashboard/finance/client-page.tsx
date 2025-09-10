'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, PlusCircle, Trash2, Pencil, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { FinanceRecord, Site } from '@/lib/types';
import { deleteFinanceRecord } from '@/actions/finance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function FinanceClientPage({
  initialRecords,
  projects,
}: {
  initialRecords: FinanceRecord[];
  projects: Site[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [projectFilter, setProjectFilter] = useState('all');
  const router = useRouter();
  const { toast } = useToast();

  const filteredRecords = useMemo(() => {
    let filtered = records;
    if (projectFilter !== 'all') {
      filtered = filtered.filter(record => record.projectId === projectFilter);
    }
    return filtered;
  }, [records, projectFilter]);

  const handleDelete = async (id: string) => {
    try {
      await deleteFinanceRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      toast({
        title: 'Sukses!',
        description: 'Catatan keuangan telah dihapus.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus catatan keuangan.',
      });
    }
  };

  const totalIncome = useMemo(() => {
    return filteredRecords
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRecords]);

  const totalExpense = useMemo(() => {
    return filteredRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRecords]);

  const netTotal = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netTotal >= 0 ? 'text-blue-600' : 'text-destructive'}`}>{formatCurrency(netTotal)}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manajemen Keuangan</CardTitle>
              <CardDescription>Catat semua pemasukan dan pengeluaran proyek.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Proyek</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button asChild>
                <Link href="/dashboard/finance/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tambah Catatan
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Proyek</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
                    <TableCell>{record.projectName}</TableCell>
                    <TableCell className="font-medium">{record.description}</TableCell>
                    <TableCell>
                      <Badge variant={record.type === 'income' ? 'default' : 'destructive'} className="capitalize">
                        {record.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(record.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Buka menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/finance/${record.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Aksi ini tidak dapat dibatalkan. Ini akan menghapus catatan keuangan secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(record.id)}>
                                  Lanjutkan
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Tidak ada catatan keuangan ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
