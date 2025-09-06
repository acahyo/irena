'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { MoreHorizontal, PlusCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { LeaveRequest } from '@/lib/types';
import { getLeaveRequests, updateLeaveRequestStatus, deleteLeaveRequest } from '@/actions/leave';

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'Approved':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function LeaveScheduleClientPage({ initialRequests }: { initialRequests: LeaveRequest[] }) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialRequests);
  const { toast } = useToast();

  useEffect(() => {
    setLeaveRequests(initialRequests);
  }, [initialRequests]);
  

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
        await updateLeaveRequestStatus(id, status);
        toast({
            title: 'Success!',
            description: `Leave request has been ${status.toLowerCase()}.`,
        });
        const updatedRequests = await getLeaveRequests();
        setLeaveRequests(updatedRequests);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update leave request status.',
        });
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
        await deleteLeaveRequest(id);
        toast({
            title: 'Success!',
            description: 'Leave request has been deleted.',
        });
        const updatedRequests = await getLeaveRequests();
        setLeaveRequests(updatedRequests);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete leave request.',
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Jadwal Cuti Karyawan</CardTitle>
            <CardDescription>
              Kelola dan lihat jadwal cuti karyawan di sini.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/leave-schedule/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajukan Cuti
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>Tanggal Mulai</TableHead>
              <TableHead>Tanggal Selesai</TableHead>
              <TableHead>Jenis Cuti</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveRequests.length > 0 ? (
              leaveRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.employeeName}</TableCell>
                  <TableCell>{format(req.startDate, 'PPP')}</TableCell>
                  <TableCell>{format(req.endDate, 'PPP')}</TableCell>
                  <TableCell>{req.type}</TableCell>
                  <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusUpdate(req.id, 'Approved')}>
                           <CheckCircle className="mr-2 h-4 w-4" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(req.id, 'Rejected')}>
                           <XCircle className="mr-2 h-4 w-4" /> Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(req.id)} className="text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada jadwal cuti ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
