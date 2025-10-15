
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
import { MoreHorizontal, PlusCircle, CheckCircle, XCircle, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { LeaveRequest, User } from '@/lib/types';
import { getLeaveRequests, updateLeaveRequestStatus, deleteLeaveRequest, approveLeaveRequestByHR } from '@/actions/leave';
import { useUser } from '@/contexts/user-context';

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'Approved':
      return 'default';
    case 'Approved by Admin Proyek':
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
  const user = useUser();

  useEffect(() => {
    setLeaveRequests(initialRequests);
  }, [initialRequests]);
  

  const handleAdminProyekApproval = async (id: string, status: 'Approved by Admin Proyek' | 'Rejected') => {
    try {
        await updateLeaveRequestStatus(id, status);
        toast({
            title: 'Success!',
            description: `Leave request has been ${status === 'Rejected' ? 'rejected' : 'approved'}.`,
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

  const handleHrApproval = async (id: string) => {
    try {
        await approveLeaveRequestByHR(id);
        toast({
            title: 'Success!',
            description: 'Leave request has been finalized and approved.',
        });
        const updatedRequests = await getLeaveRequests();
        setLeaveRequests(updatedRequests);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to approve leave request.',
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

  if (!user) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <div className="space-y-6">
        {user.role === 'Admin Proyek' && (
            <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Dasbor
                </Link>
            </Button>
        )}
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
                    <TableCell>{format(new Date(req.startDate), 'PPP')}</TableCell>
                    <TableCell>{format(new Date(req.endDate), 'PPP')}</TableCell>
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
                            {user.role === 'Admin Proyek' && req.status === 'Pending' && (
                                <>
                                    <DropdownMenuItem onClick={() => handleAdminProyekApproval(req.id, 'Approved by Admin Proyek')}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAdminProyekApproval(req.id, 'Rejected')}>
                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                    </DropdownMenuItem>
                                </>
                            )}
                             {(user.role === 'HR' || user.role === 'Administrator') && (
                                <>
                                    {req.status === 'Approved by Admin Proyek' && (
                                        <DropdownMenuItem onClick={() => handleHrApproval(req.id)}>
                                            <CheckCircle className="mr-2 h-4 w-4" /> Final Approve
                                        </DropdownMenuItem>
                                    )}
                                    {req.status !== 'Approved' && (
                                        <DropdownMenuItem onClick={() => handleAdminProyekApproval(req.id, 'Rejected')}>
                                            <XCircle className="mr-2 h-4 w-4" /> Reject
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleDelete(req.id)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </>
                             )}
                             
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
    </div>
  );
}
