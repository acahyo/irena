import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getEmployees } from '@/actions/employees';
import type { User } from '@/lib/types';
import { Users, UserCheck, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

async function getDashboardData() {
    const allEmployees = await getEmployees();
    const pendingEmployees = allEmployees.filter(e => e.employeeStatus === 'pending');
    
    const activeThisMonth = allEmployees.filter(e => {
        if (e.employeeStatus !== 'active' || !e.contractStartDate) return false;
        const startDate = new Date(e.contractStartDate);
        const today = new Date();
        return startDate.getMonth() === today.getMonth() && startDate.getFullYear() === today.getFullYear();
    }).length;

    return {
        pendingEmployees,
        totalPending: pendingEmployees.length,
        activeThisMonth,
    };
}

export default async function RecruitmentDashboard({ user }: { user: User }) {
    const data = await getDashboardData();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Dasbor Rekrutmen</CardTitle>
                    <CardDescription>Ringkasan proses rekrutmen dan pendaftaran karyawan baru.</CardDescription>
                </CardHeader>
            </Card>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendaftaran Tertunda</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalPending}</div>
                        <p className="text-xs text-muted-foreground">Karyawan menunggu persetujuan.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Karyawan Aktif Bulan Ini</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.activeThisMonth}</div>
                        <p className="text-xs text-muted-foreground">Jumlah karyawan yang baru aktif.</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pendaftaran Menunggu Persetujuan</CardTitle>
                    <CardDescription>Karyawan berikut perlu ditinjau dan disetujui oleh HR atau Administrator.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <ScrollArea className="h-72">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Karyawan</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead>Proyek</TableHead>
                                    <TableHead>Tanggal Pendaftaran</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.pendingEmployees.length > 0 ? (
                                    data.pendingEmployees.map(emp => (
                                        <TableRow key={emp.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={emp.avatar} alt={emp.name} />
                                                        <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{emp.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{emp.positions?.join(', ') || 'N/A'}</TableCell>
                                            <TableCell>{emp.siteLocation}</TableCell>
                                            <TableCell>{emp.contractStartDate ? format(new Date(emp.contractStartDate), 'PPP') : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href="/dashboard/employees/review">Tinjau</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Tidak ada pendaftaran yang menunggu persetujuan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
