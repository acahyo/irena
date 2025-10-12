
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getEmployees } from '@/actions/employees';
import type { User } from '@/lib/types';
import { Users, UserCheck, UserPlus, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import QuickNikCheck from './quick-nik-check';

async function getDashboardData() {
    const allEmployees = await getEmployees();
    const today = new Date();

    const pendingEmployees = allEmployees.filter(e => e.employeeStatus === 'pending');
    const activeEmployeesCount = allEmployees.filter(e => e.employeeStatus === 'active').length;
    
    const activeThisMonthCount = allEmployees.filter(e => {
        if (e.employeeStatus !== 'active' || !e.contractStartDate) return false;
        const startDate = new Date(e.contractStartDate);
        return isSameMonth(startDate, today) && isSameYear(startDate, today);
    }).length;

    const recruitedTodayCount = allEmployees.filter(e => {
        if (!e.contractStartDate) return false; // Assuming new candidates have this date set on creation
        return isSameDay(new Date(e.contractStartDate), today);
    }).length;

    return {
        allEmployees,
        pendingEmployees,
        activeEmployeesCount,
        pendingEmployeesCount: pendingEmployees.length,
        activeThisMonthCount,
    };
}

export default async function RecruitmentDashboard({ user }: { user: User }) {
    const data = await getDashboardData();

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Karyawan Aktif</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.activeEmployeesCount}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Menunggu Persetujuan HR</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.pendingEmployeesCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Karyawan Aktif Bulan Ini</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.activeThisMonthCount}</div>
                    </CardContent>
                </Card>
            </div>
            
            <QuickNikCheck allEmployees={data.allEmployees} />

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Pendaftaran Menunggu Verifikasi</CardTitle>
                            <CardDescription>Daftar calon karyawan yang perlu diverifikasi dan dilengkapi datanya oleh HR.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/dashboard/employees/new">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Daftarkan Kandidat
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                 <CardContent>
                    <ScrollArea className="h-72">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Kandidat</TableHead>
                                    <TableHead>NIK</TableHead>
                                    <TableHead>No. HP</TableHead>
                                    <TableHead>Email</TableHead>
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
                                            <TableCell>{emp.nik}</TableCell>
                                            <TableCell>{emp.phone || '-'}</TableCell>
                                            <TableCell>{emp.email || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/dashboard/employees/${emp.id}/edit`}>Verifikasi & Lengkapi</Link>
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
