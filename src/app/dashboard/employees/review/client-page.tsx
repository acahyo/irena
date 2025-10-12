
'use client';

import { useState, useMemo } from 'react';
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
import { updateEmployee, deleteEmployee } from '@/actions/employees';
import type { Employee, Site } from '@/lib/types';
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function ReviewEmployeesClientPage({ pendingEmployees, sites }: { pendingEmployees: Employee[], sites: Site[] }) {
  const [employees, setEmployees] = useState(pendingEmployees);
  const [loading, setLoading] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState('all');
  const router = useRouter();
  const { toast } = useToast();

  const filteredEmployees = useMemo(() => {
    if (projectFilter === 'all') {
      return employees;
    }
    return employees.filter(emp => emp.siteLocation === projectFilter);
  }, [employees, projectFilter]);


  const handleApprove = async (employeeId: string) => {
    setLoading(employeeId);
    try {
      await updateEmployee(employeeId, { employeeStatus: 'active' });
      toast({
        title: 'Success!',
        description: 'Employee has been approved and is now active.',
      });
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve employee.',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (employeeId: string) => {
    setLoading(employeeId);
    try {
      await deleteEmployee(employeeId);
      toast({
        title: 'Success!',
        description: 'Employee registration has been rejected and deleted.',
      });
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete employee record.',
      });
    } finally {
        setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <CardTitle>Tinjau Registrasi Karyawan</CardTitle>
            <CardDescription>
              Setujui atau tolak pendaftaran karyawan baru yang diinput oleh Admin Proyek.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter Berdasarkan Proyek" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Proyek</SelectItem>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.name}>{site.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Proyek</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
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
                  <TableCell>{emp.position || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{emp.siteLocation || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={loading === emp.id}>
                            {loading === emp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tolak Registrasi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Aksi ini akan menghapus data registrasi karyawan secara permanen. Anda yakin?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleReject(emp.id)}>
                            Ya, Tolak & Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={() => handleApprove(emp.id)} size="sm" disabled={loading === emp.id}>
                      {loading === emp.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                      Setujui
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada registrasi karyawan yang menunggu persetujuan untuk filter ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
