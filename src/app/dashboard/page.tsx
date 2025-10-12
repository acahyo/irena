

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, CalendarOff, UserCheck, Clock, UserX, LogOut, CircleSlash, ListChecks, UserRound, AlertOctagon } from 'lucide-react';
import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import type { Employee, ViolationRecord } from '@/lib/types';
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
import { getViolationRecords } from '@/actions/violations';
import { format, getMonth, getYear, differenceInDays } from 'date-fns';
import ViolationChart from './violation-chart';
import FinanceDashboard from './finance-dashboard';
import HseDashboard from './hse-dashboard';
import DisciplinaryDashboard from './disciplinary-dashboard';


async function getDashboardData({ siteIds }: { siteIds?: string[] }) {
    const [allEmployees, allLeaveRequests, violationRecords] = await Promise.all([
        getEmployees(), 
        getLeaveRequests({}), 
        getViolationRecords()
    ]);
    
    // Filter employees based on user's site access for most stats
    const filteredEmployees = siteIds 
        ? allEmployees.filter(e => e.siteLocation && siteIds.includes(e.siteLocation)) 
        : allEmployees;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredEmployeeIds = new Set(filteredEmployees.map(e => e.id));

    const approvedLeave = allLeaveRequests.filter(
        (req) =>
            filteredEmployeeIds.has(req.employeeId) &&
            req.status === 'Approved' &&
            new Date(req.startDate) <= today &&
            new Date(req.endDate) >= today
    );
    
    const employeesByProject = filteredEmployees
        .filter(emp => emp.employeeStatus === 'active')
        .reduce((acc, emp) => {
            const project = emp.siteLocation || 'Unassigned';
            if (!acc[project]) {
                acc[project] = {};
            }
            (emp.positions || ['Unassigned']).forEach(position => {
                if (!acc[project][position]) {
                    acc[project][position] = 0;
                }
                acc[project][position]++;
            });
            return acc;
    }, {} as Record<string, Record<string, number>>);
    
    const employeesByPosition = Object.entries(employeesByProject).map(([projectName, positions]) => ({
        projectName,
        positions: Object.entries(positions).map(([positionName, count]) => ({
            positionName,
            count
        })).sort((a, b) => b.count - a.count),
    })).sort((a,b) => a.projectName.localeCompare(b.projectName));


    const employeesByStatus = filteredEmployees.reduce((acc, emp) => {
        const status = emp.employeeStatus || 'active';
        if (acc[status as keyof typeof acc]) {
            acc[status as keyof typeof acc]++;
        } else {
            acc[status as keyof typeof acc] = 1;
        }
        return acc;
    }, { active: 0, nonaktif: 0, resign: 0, phk: 0, pending: 0, "Pending PHK Approval": 0 });

    const leaveRecommendation = allEmployees
        .filter(emp => emp.employeeStatus === 'active')
        .map(emp => {
            const lastApprovedLeave = allLeaveRequests
                .filter(req => req.employeeId === emp.id && req.status === 'Approved')
                .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

            const referenceDate = lastApprovedLeave ? new Date(lastApprovedLeave.endDate) : (emp.contractStartDate ? new Date(emp.contractStartDate) : null);
            
            if (!referenceDate) return null;

            const daysActive = differenceInDays(today, referenceDate);
            return { ...emp, daysActive };
        })
        .filter((emp): emp is Employee & { daysActive: number } => emp !== null && emp.daysActive >= 120);
        
    const violationsSummary = violationRecords.reduce((acc, record) => {
        const key = `${record.siteLocation}-${record.employeePosition}-${record.status}`;
        if (!acc[key]) {
            acc[key] = {
                project: record.siteLocation,
                position: record.employeePosition,
                status: record.status,
                count: 0
            };
        }
        acc[key].count++;
        return acc;
    }, {} as Record<string, { project: string; position: string; status: ViolationRecord['status']; count: number }>);
    
    const violationHistory = violationRecords.reduce((acc, record) => {
        const recordDate = new Date(record.date);
        const month = format(recordDate, 'MMM');
        const year = getYear(recordDate);
        const key = `${year}-${month}`;

        if (!acc[key]) {
            acc[key] = { month, SP1: 0, SP2: 0, SP3: 0, SPPT: 0 };
        }
        acc[key][record.status]++;
        
        return acc;
    }, {} as Record<string, { month: string; SP1: number; SP2: number; SP3: number; SPPT: number; }>);
    
    const sortedViolationHistory = Object.values(violationHistory).sort((a,b) => {
        const dateA = new Date(`01-${a.month}-2024`);
        const dateB = new Date(`01-${b.month}-2024`);
        return dateA.getTime() - dateB.getTime();
    });


    return {
        totalEmployees: filteredEmployees.length,
        employeesOnLeave: approvedLeave.length,
        employeesByPosition,
        employeesByStatus: employeesByStatus,
        leaveRecommendation,
        violationsSummary: Object.values(violationsSummary).sort((a, b) => a.project.localeCompare(b.project) || a.position.localeCompare(b.position)),
        violationHistory: sortedViolationHistory,
    };
}


export default async function DashboardPage({ searchParams }: { searchParams: { projectId?: string } }) {
    const user = await getAdminSession();
    if (!user) {
        redirect('/');
    }

    if (user.role === 'HSE') {
        return <HseDashboard user={user} />;
    }

    if (user.role === 'Finance') {
        return <FinanceDashboard user={user} />;
    }
    
    if (user.role === 'Disipliner') {
        return <DisciplinaryDashboard user={user} />;
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
    
    // For HR and Administrator, determine site IDs to filter by.
    // If Admin Proyek has `projectAccess: 'all'`, they should also see all sites.
    const siteIdsForFilter = (user.role === 'HR' || user.role === 'Administrator' || (user.role === 'Admin Proyek' && user.projectAccess === 'all'))
        ? undefined 
        : user.siteIds;

    const [stats, settings] = await Promise.all([
        getDashboardData({ siteIds: siteIdsForFilter }),
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
        employeesByProject: lang === 'id' ? 'Karyawan Berdasarkan Proyek' : 'Employees by Project',
        no: lang === 'id' ? 'No' : 'No',
        project: lang === 'id' ? 'Proyek' : 'Project',
        position: lang === 'id' ? 'Jabatan' : 'Position',
        employeeCount: lang === 'id' ? 'Jumlah Karyawan' : 'Number of Employees',
        noPositionData: lang === 'id' ? 'Tidak ada data karyawan.' : 'No employee data available.',
        leaveRecommendation: lang === 'id' ? 'Rekomendasi Cuti' : 'Leave Recommendation',
        leaveRecommendationDesc: lang === 'id' ? 'Karyawan aktif >120 hari yang direkomendasikan untuk mengambil cuti.' : 'Active employees >120 days recommended for leave.',
        days: lang === 'id' ? 'hari' : 'days',
        noRecommendation: lang === 'id' ? 'Tidak ada karyawan yang memenuhi kriteria saat ini.' : 'No employees meet the criteria at this time.',
        violationRecap: lang === 'id' ? 'Rekap Pelanggaran' : 'Violation Recap',
        violationStatus: lang === 'id' ? 'Status Peringatan' : 'Warning Status',
        noViolationData: lang === 'id' ? 'Tidak ada data pelanggaran.' : 'No violation data available.',
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
    
    const getViolationStatusVariant = (status: ViolationRecord['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
      switch (status) {
        case 'SP1': return 'default';
        case 'SP2': return 'secondary';
        case 'SP3': return 'destructive';
        case 'SPPT': return 'outline';
        default: return 'outline';
      }
    };


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
                        <CardTitle>{T.employeesByProject}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">{T.no}</TableHead>
                                        <TableHead>{T.project}</TableHead>
                                        <TableHead>{T.position}</TableHead>
                                        <TableHead className="text-right">{T.employeeCount}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.employeesByPosition.length > 0 ? (
                                        stats.employeesByPosition.flatMap((proj, projIndex) =>
                                            proj.positions.map((pos, posIndex) => (
                                                <TableRow key={`${proj.projectName}-${pos.positionName}-${posIndex}`}>
                                                    {posIndex === 0 && (
                                                        <TableCell rowSpan={proj.positions.length} className="align-top font-medium">
                                                            {projIndex + 1}
                                                        </TableCell>
                                                    )}
                                                    {posIndex === 0 && (
                                                        <TableCell rowSpan={proj.positions.length} className="align-top font-medium">
                                                            {proj.projectName}
                                                        </TableCell>
                                                    )}
                                                    <TableCell>{pos.positionName}</TableCell>
                                                    <TableCell className="text-right">{pos.count}</TableCell>
                                                </TableRow>
                                            ))
                                        )
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                {T.noPositionData}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListChecks />
                            {T.leaveRecommendation}
                        </CardTitle>
                        <CardDescription>{T.leaveRecommendationDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Karyawan</TableHead>
                                        <TableHead>Jabatan</TableHead>
                                        <TableHead className="text-right">Hari Aktif</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.leaveRecommendation.length > 0 ? (
                                        stats.leaveRecommendation.map(emp => (
                                            <TableRow key={emp.id}>
                                                <TableCell>
                                                    <Link href={`/dashboard/employees/${emp.id}`} className="font-medium hover:underline">{emp.name}</Link>
                                                    <div className="text-xs text-muted-foreground">{emp.siteLocation || 'N/A'}</div>
                                                </TableCell>
                                                <TableCell className="text-xs">{emp.position}</TableCell>
                                                <TableCell className="text-right font-medium">{emp.daysActive} {T.days}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                <UserRound className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">{T.noRecommendation}</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <ViolationChart data={stats.violationHistory} />
                
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><AlertOctagon /> {T.violationRecap}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-72">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{T.project}</TableHead>
                                    <TableHead>{T.position}</TableHead>
                                    <TableHead>{T.violationStatus}</TableHead>
                                    <TableHead className="text-right">{T.employeeCount}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.violationsSummary.length > 0 ? (
                                    stats.violationsSummary.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.project}</TableCell>
                                            <TableCell>{item.position}</TableCell>
                                            <TableCell>
                                                <Badge variant={getViolationStatusVariant(item.status)}>{item.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{item.count}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            {T.noViolationData}
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
