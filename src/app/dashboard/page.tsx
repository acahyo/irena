
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarOff, UserCheck, Clock, UserX, LogOut, CircleSlash, ListChecks, UserRound } from 'lucide-react';
import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import type { Employee } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { DashboardClock } from './client-page';
import { getSettings } from '@/actions/settings';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import AdminProjectDashboard from './admin-project-dashboard';
import PurchasingDashboard from './purchasing-dashboard';
import AttendanceAdminDashboard from './attendance-admin-dashboard';
import { getSitesByIds } from '@/actions/sites';


async function getDashboardData({ siteIds }: { siteIds?: string[] }) {
    const [employees, leaveRequests] = await Promise.all([
        getEmployees({ siteIds }),
        getLeaveRequests({ siteId: siteIds ? siteIds[0] : undefined }) // Leave requests might need more specific logic for multi-site
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedLeave = leaveRequests.filter(
        (req) =>
            req.status === 'Approved' &&
            new Date(req.startDate) <= today &&
            new Date(req.endDate) >= today
    );
    
    const employeesByPosition = employees.reduce((acc, emp) => {
        const position = emp.position || 'Unassigned';
        const existing = acc.find(item => item.name === position);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: position, value: 1 });
        }
        return acc;
    }, [] as { name: string, value: number }[]);

    const employeesByStatus = employees.reduce((acc, emp) => {
        const status = emp.employeeStatus || 'active';
        if (acc[status as keyof typeof acc]) {
            acc[status as keyof typeof acc]++;
        } else {
            acc[status as keyof typeof acc] = 1;
        }
        return acc;
    }, { active: 0, nonaktif: 0, resign: 0, phk: 0 });

    const leaveRecommendation = employees
        .filter(emp => emp.contractStartDate)
        .map(emp => {
            const startDate = new Date(emp.contractStartDate!);
            const diffTime = today.getTime() - startDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
            return { ...emp, daysActive: diffDays };
        })
        .filter(emp => emp.daysActive! >= 120 && emp.employeeStatus === 'active');

    return {
        totalEmployees: employees.length,
        employeesOnLeave: approvedLeave.length,
        employeesByPosition: employeesByPosition.sort((a,b) => b.value - a.value),
        employeesByStatus: employeesByStatus,
        leaveRecommendation,
    };
}


export default async function DashboardPage({ searchParams, userSiteIds }: { searchParams: { projectId?: string }, userSiteIds?: string[] }) {
    const user = await getAdminSession();
    if (!user) {
        redirect('/');
    }

    // If user is Admin Proyek, show their specific dashboard
    if (user.role === 'Admin Proyek') {
        const assignedSites = user.siteIds ? await getSitesByIds(user.siteIds) : [];
        return <AdminProjectDashboard user={user} assignedSites={assignedSites} currentProjectId={searchParams.projectId} />;
    }

    // If user is Purchasing, show their dashboard
    if (user.role === 'Purchasing') {
        return <PurchasingDashboard user={user} />;
    }
    
    // If user is Admin Absensi, show their dashboard
    if (user.role === 'Admin Absensi') {
        return <AttendanceAdminDashboard user={user} />;
    }

    const [stats, settings] = await Promise.all([
        getDashboardData({ siteIds: userSiteIds }), // General admin sees all sites
        getSettings()
    ]);
    
    const lang = settings.language || 'id';

    const T = {
        totalEmployees: lang === 'id' ? 'Total Karyawan' : 'Total Employees',
        totalEmployeesDesc: lang === 'id' ? 'Jumlah seluruh karyawan terdaftar' : 'Total number of registered employees',
        employeesOnLeave: lang === 'id' ? 'Karyawan Cuti' : 'Employees on Leave',
        employeesOnLeaveDesc: lang === 'id' ? 'Jumlah karyawan yang sedang cuti' : 'Number of employees currently on leave',
        employeeStatus: lang === 'id' ? 'Status Karyawan' : 'Employee Status',
        active: lang === 'id' ? 'Aktif' : 'Active',
        inactive: lang === 'id' ? 'Non-Aktif' : 'Inactive',
        resign: lang === 'id' ? 'Resign' : 'Resigned',
        phk: lang === 'id' ? 'PHK' : 'Terminated',
        employeesByPosition: lang === 'id' ? 'Karyawan Berdasarkan Jabatan' : 'Employees by Position',
        no: lang === 'id' ? 'No' : 'No',
        position: lang === 'id' ? 'Jabatan' : 'Position',
        employeeCount: lang === 'id' ? 'Jumlah Karyawan' : 'Number of Employees',
        noPositionData: lang === 'id' ? 'Tidak ada data jabatan.' : 'No position data available.',
        leaveRecommendation: lang === 'id' ? 'Rekomendasi Cuti' : 'Leave Recommendation',
        leaveRecommendationDesc: lang === 'id' ? 'Karyawan aktif lebih dari 120 hari yang direkomendasikan untuk mengambil cuti.' : 'Active employees for more than 120 days recommended to take leave.',
        days: lang === 'id' ? 'hari' : 'days',
        noRecommendation: lang === 'id' ? 'Tidak ada karyawan yang memenuhi kriteria saat ini.' : 'No employees meet the criteria at this time.',
    };

    const StatusItem = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color?: string }) => (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm">{label}</span>
            </div>
            <Badge variant="secondary" className={color}>{value}</Badge>
        </div>
    );

    return (
        <div className="space-y-6">
             <div className="grid gap-6 md:grid-cols-4">
                 <DashboardClock lang={lang} />
                <Link href="/dashboard/employees" className="transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{T.totalEmployees}</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                            <p className="text-xs text-muted-foreground">{T.totalEmployeesDesc}</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/leave-schedule" className="transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{T.employeesOnLeave}</CardTitle>
                            <CalendarOff className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.employeesOnLeave}</div>
                            <p className="text-xs text-muted-foreground">{T.employeesOnLeaveDesc}</p>
                        </CardContent>
                    </Card>
                </Link>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{T.employeeStatus}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                       <StatusItem icon={<UserCheck className="h-4 w-4 text-green-500" />} label={T.active} value={stats.employeesByStatus.active} color="bg-green-100 text-green-800" />
                       <StatusItem icon={<UserX className="h-4 w-4 text-yellow-500" />} label={T.inactive} value={stats.employeesByStatus.nonaktif} color="bg-yellow-100 text-yellow-800" />
                       <StatusItem icon={<LogOut className="h-4 w-4 text-blue-500" />} label={T.resign} value={stats.employeesByStatus.resign} color="bg-blue-100 text-blue-800" />
                       <StatusItem icon={<CircleSlash className="h-4 w-4 text-red-500" />} label={T.phk} value={stats.employeesByStatus.phk} color="bg-red-100 text-red-800" />
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{T.employeesByPosition}</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">{T.no}</TableHead>
                                    <TableHead>{T.position}</TableHead>
                                    <TableHead className="text-right">{T.employeeCount}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.employeesByPosition.map((pos, index) => (
                                    <TableRow key={pos.name}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className="font-medium">{pos.name}</TableCell>
                                        <TableCell className="text-right">{pos.value}</TableCell>
                                    </TableRow>
                                ))}
                                {stats.employeesByPosition.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            {T.noPositionData}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListChecks />
                            {T.leaveRecommendation}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            {T.leaveRecommendationDesc}
                        </p>
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-4">
                                {stats.leaveRecommendation.length > 0 ? (
                                    stats.leaveRecommendation.map(emp => (
                                        <div key={emp.id} className="flex items-center">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={emp.avatar} alt={emp.name} />
                                                <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="ml-4 space-y-1">
                                                <Link href={`/dashboard/employees/${emp.id}`} className="text-sm font-medium leading-none hover:underline">{emp.name}</Link>
                                                <p className="text-xs text-muted-foreground">{emp.position}</p>
                                            </div>
                                            <div className="ml-auto font-medium text-xs">{emp.daysActive} {T.days}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                                        <UserRound className="h-8 w-8 mb-2" />
                                        <p className="text-sm">{T.noRecommendation}</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
