
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateEmployee } from '@/actions/employees';
import type { Employee } from '@/lib/types';
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
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

export default function ReviewSeparationsClientPage({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleApprove = async (employeeId: string) => {
    setLoading(employeeId);
    try {
      await updateEmployee(employeeId, { employeeStatus: 'phk' });
      toast({
        title: 'Success!',
        description: 'PHK Karyawan telah disetujui.',
      });
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menyetujui PHK.',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (employeeId: string) => {
    setLoading(employeeId);
    try {
      await updateEmployee(employeeId, { employeeStatus: 'active' });
      toast({
        title: 'Success!',
        description: 'Rekomendasi PHK telah ditolak dan status karyawan dikembalikan ke aktif.',
      });
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menolak rekomendasi PHK.',
      });
    } finally {
        setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
          <div>
            <CardTitle>Tinjau Rekomendasi PHK</CardTitle>
            <CardDescription>
              Setujui atau tolak rekomendasi PHK yang diinput oleh Admin Proyek atau Disipliner.
            </CardDescription>
          </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Proyek</TableHead>
              <TableHead>Alasan Rekomendasi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length > 0 ? (
              employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={emp.avatar} alt={emp.name} />
                        <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Link href={`/dashboard/employees/${emp.id}`} className="font-medium hover:underline">{emp.name}</Link>
                    </div>
                  </TableCell>
                  <TableCell>{emp.nik}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{emp.siteLocation || 'N/A'}</Badge>
                  </TableCell>
                   <TableCell className="text-sm text-muted-foreground">{emp.separationReason || 'Tidak ada alasan.'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={loading === emp.id}>
                            {loading === emp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Tolak
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tolak Rekomendasi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Status karyawan akan dikembalikan menjadi "Aktif". Anda yakin?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleReject(emp.id)}>
                            Ya, Tolak Rekomendasi
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={() => handleApprove(emp.id)} size="sm" disabled={loading === emp.id}>
                      {loading === emp.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                      Setujui PHK
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada rekomendasi PHK yang menunggu persetujuan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
