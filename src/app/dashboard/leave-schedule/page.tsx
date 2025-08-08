
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data for leave schedule
const leaveRequests = [
    { id: '1', employeeName: 'Alice Johnson', startDate: '2024-08-15', endDate: '2024-08-20', type: 'Annual Leave', status: 'Approved' },
    { id: '2', employeeName: 'Bob Williams', startDate: '2024-09-01', endDate: '2024-09-02', type: 'Sick Leave', status: 'Pending' },
    { id: '3', employeeName: 'Charlie Brown', startDate: '2024-08-25', endDate: '2024-08-25', type: 'Unpaid Leave', status: 'Rejected' },
];

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
      switch (status.toLowerCase()) {
          case 'approved':
              return 'default';
          case 'pending':
              return 'secondary';
          case 'rejected':
              return 'destructive';
          default:
              return 'outline';
      }
  };


export default function LeaveSchedulePage() {
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
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {leaveRequests.map((req) => (
                    <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.employeeName}</TableCell>
                        <TableCell>{req.startDate}</TableCell>
                        <TableCell>{req.endDate}</TableCell>
                        <TableCell>{req.type}</TableCell>
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
                                    <DropdownMenuItem>Approve</DropdownMenuItem>
                                    <DropdownMenuItem>Reject</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
                 {leaveRequests.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
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
