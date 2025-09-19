import Link from 'next/link';
import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User, Employee, LeaveRequest, AttendanceRecord } from '@/lib/types';
import { Users, CalendarOff, UserCheck, AlertTriangle, ListChecks, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

async function getDashboardData(positionName?: string) {
    if (!positionName) {
        return {
            employees: [],
            onLeave: 0,
            active: 0,
            leaveRecommendation: [],
            lowAttendance: [],
        };
    }

    const allEmployees = await getEmployees();
    const employees = allEmployees.filter(e => e.position === positionName);
    const employeeIds = employees.map(e => e.id);

    if (employeeIds.length === 0) {
         return { employees: [], onLeave: 0, active: 0, leaveRecommendation: [], lowAttendance: [] };
    }
    
    // Firestore 'in' queries are limited to 30 items.
    // Fetch all and filter in application code if there are more.
    const allLeaveRequests = await getLeaveRequests();
    const leaveRequests = allLeaveRequests.filter(req => employeeIds.includes(req.employeeId));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const onLeave = leaveRequests.filter(
        (req) =>
            req.status === 'Approved' &&
            new Date(req.startDate) <= today &&
            new Date(req.endDate) >= today
    ).length;

    const activeEmployees = employees.filter(emp => emp.employeeStatus === 'active' && !emp.onLeave).length;

    const leaveRecommendation = employees
        .filter(emp => emp.contractStartDate)
        .map(emp => {
            const startDate = new Date(emp.contractStartDate!);
            const diffTime = today.getTime() - startDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
            return { ...emp, daysActive: diffDays };
        })
        .filter(emp => emp.daysActive! >= 120 && emp.employeeStatus === 'active');
        
    const currentPeriod = new Date().toISOString().slice(0, 7);
    const attendanceRecords = await getAttendanceByPeriod(currentPeriod);
    const lowAttendance = employees.map(emp => {
        const record = attendanceRecords.find(r => r.employeeId === emp.id);
        const attendanceDays = record?.attendanceDays || 0;
        return { ...emp, attendanceDays };
    }).filter(emp => emp.attendanceDays < 26);


    return {
        employees,
        onLeave,
        active: activeEmployees,
        leaveRecommendation,
        lowAttendance,
    };
}

export default async function AttendanceAdminDashboard({ user }: { user: User }) {
    const data = await getDashboardData(user.positionName);

    if (!user.positionName) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Jabatan untuk Admin Absensi tidak diatur. Silakan hubungi Administrator.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Dasbor Admin Absensi</CardTitle>
                    <CardDescription>Menampilkan data untuk jabatan: <span className="font-bold">{user.positionName}</span></CardDescription>
                </CardHeader>
            </Card>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Karyawan Aktif</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Karyawan Izin/Cuti</CardTitle>
                        <CalendarOff className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.onLeave}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.employees.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListChecks /> Rekomendasi Cuti
                        </CardTitle>
                        <CardDescription>Karyawan aktif lebih dari 120 hari.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-4">
                                {data.leaveRecommendation.length > 0 ? (
                                    data.leaveRecommendation.map(emp => (
                                        <div key={emp.id} className="flex items-center">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={emp.avatar} alt={emp.name} />
                                                <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="ml-4 space-y-1">
                                                <Link href={`/dashboard/employees/${emp.id}`} className="text-sm font-medium leading-none hover:underline">{emp.name}</Link>
                                                <p className="text-xs text-muted-foreground">{emp.siteLocation}</p>
                                            </div>
                                            <div className="ml-auto font-medium text-xs">{emp.daysActive} hari</div>
                                        </div>
                                    ))
                                ) : (
                                     <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                                        <UserRound className="h-8 w-8 mb-2" />
                                        <p className="text-sm">Tidak ada karyawan yang memenuhi kriteria saat ini.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <AlertTriangle className="text-destructive" /> Kehadiran di Bawah 26 Hari
                        </CardTitle>
                        <CardDescription>Daftar karyawan dengan kehadiran kurang dari 26 hari bulan ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Karyawan</TableHead>
                                        <TableHead className="text-right">Total Hadir</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.lowAttendance.length > 0 ? (
                                        data.lowAttendance.map(emp => (
                                            <TableRow key={emp.id}>
                                                <TableCell className="font-medium">{emp.name}</TableCell>
                                                <TableCell className="text-right">{emp.attendanceDays} hari</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center">
                                                Semua karyawan memiliki kehadiran yang cukup.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
