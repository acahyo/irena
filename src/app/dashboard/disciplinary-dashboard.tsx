

import Link from 'next/link';
import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User, Employee, ViolationRecord } from '@/lib/types';
import { Users, CalendarOff, UserCheck, AlertTriangle, AlertOctagon, UserMinus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getYear, format } from 'date-fns';
import { getViolationRecords } from '@/actions/violations';
import { Badge } from '@/components/ui/badge';
import ViolationChart from './violation-chart';
import QuickSeparationForm from './quick-separation-form';
import SeparationHistoryCard from './separation-history-card';

async function getDashboardData() {
    
    const [employees, leaveRequests, violationRecords] = await Promise.all([
        getEmployees(),
        getLeaveRequests(),
        getViolationRecords(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const onLeave = leaveRequests.filter(
        (req) =>
            req.status === 'Approved' &&
            new Date(req.startDate) <= today &&
            new Date(req.endDate) >= today
    ).length;

    const activeEmployees = employees.filter(emp => emp.employeeStatus === 'active' && !emp.onLeave).length;

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
    
    const totalViolations = violationRecords.length;

    const separationsSummary = employees
        .filter(emp => emp.employeeStatus === 'resign' || emp.employeeStatus === 'phk')
        .reduce((acc, emp) => {
            const position = emp.positions?.[0] || 'N/A';
            const key = `${emp.siteLocation}-${position}-${emp.employeeStatus}`;
            if (!acc[key]) {
                acc[key] = {
                    project: emp.siteLocation || 'N/A',
                    position: position,
                    status: emp.employeeStatus as 'resign' | 'phk',
                    count: 0
                };
            }
            acc[key].count++;
            return acc;
        }, {} as Record<string, { project: string; position: string; status: 'resign' | 'phk'; count: number }>);

    return {
        employees,
        violationRecords,
        onLeave,
        active: activeEmployees,
        violationsSummary: Object.values(violationsSummary).sort((a, b) => a.project.localeCompare(b.project) || a.position.localeCompare(b.position)),
        violationHistory: sortedViolationHistory,
        totalViolations,
        separationsSummary: Object.values(separationsSummary).sort((a, b) => a.project.localeCompare(b.project) || a.position.localeCompare(b.position)),
    };
}

const getViolationStatusVariant = (status: ViolationRecord['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
      switch (status) {
        case 'SP1': return 'default';
        case 'SP2': return 'secondary';
        case 'SP3': return 'destructive';
        case 'SPPT': return 'outline';
        default: return 'outline';
      }
};

const getSeparationStatusVariant = (status: 'resign' | 'phk'): 'outline' | 'destructive' => {
      switch (status) {
        case 'resign': return 'outline';
        case 'phk': return 'destructive';
        default: return 'outline';
      }
};

export default async function DisciplinaryDashboard({ user }: { user: User }) {
    const data = await getDashboardData();
    const separatedEmployees = data.employees.filter(
        emp => emp.employeeStatus === 'resign' || emp.employeeStatus === 'phk'
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pelanggaran</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalViolations}</div>
                         <p className="text-xs text-muted-foreground">Jumlah semua jenis pelanggaran</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Karyawan Aktif</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.active}</div>
                         <p className="text-xs text-muted-foreground">Total karyawan yang aktif bekerja</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Karyawan Izin/Cuti</CardTitle>
                        <CalendarOff className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.onLeave}</div>
                         <p className="text-xs text-muted-foreground">Jumlah karyawan yang sedang tidak masuk</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <QuickSeparationForm employees={data.employees} violations={data.violationRecords} />
                    <SeparationHistoryCard separatedEmployees={separatedEmployees} />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserMinus /> Rekap Karyawan Resign/PHK</CardTitle>
                        <CardDescription>Ringkasan karyawan yang telah resign atau di-PHK.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-48">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Proyek</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.separationsSummary.length > 0 ? (
                                    data.separationsSummary.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.project}</TableCell>
                                            <TableCell>{item.position}</TableCell>
                                            <TableCell>
                                                <Badge variant={getSeparationStatusVariant(item.status)}>{item.status.toUpperCase()}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{item.count}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Tidak ada data karyawan keluar.
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
                <ViolationChart data={data.violationHistory} />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><AlertOctagon /> Rekap Pelanggaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-72">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Proyek</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead>Status Peringatan</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.violationsSummary.length > 0 ? (
                                    data.violationsSummary.map((item, index) => (
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
                                            Tidak ada data pelanggaran.
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
