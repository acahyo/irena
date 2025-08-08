
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarOff, UserCheck, Loader2, Clock, UserX, LogOut, CircleSlash, ListChecks, UserRound } from 'lucide-react';
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


export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        employeesOnLeave: 0,
        employeesByPosition: [] as { name: string, value: number }[],
        employeesByStatus: {
            active: 0,
            nonaktif: 0,
            resign: 0,
            phk: 0
        },
        leaveRecommendation: [] as Employee[],
    });
    const [loading, setLoading] = useState(true);
    const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

     useEffect(() => {
        // Set initial time on client mount to avoid hydration mismatch
        setCurrentDateTime(new Date());

        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000); // Update every second

        return () => clearInterval(timer); // Cleanup on component unmount
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [employees, leaveRequests] = await Promise.all([
                    getEmployees(),
                    getLeaveRequests()
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


                setStats({
                    totalEmployees: employees.length,
                    employeesOnLeave: approvedLeave.length,
                    employeesByPosition: employeesByPosition.sort((a,b) => b.value - a.value),
                    employeesByStatus: employeesByStatus,
                    leaveRecommendation,
                });

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

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
                 <Card className="md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Date & Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {currentDateTime ? (
                            <>
                                <div className="text-2xl font-bold">{currentDateTime.toLocaleTimeString('id-ID')}</div>
                                <p className="text-xs text-muted-foreground">{currentDateTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </>
                        ) : (
                             <div className="space-y-2">
                                <div className="h-7 w-3/4 animate-pulse rounded-md bg-muted"></div>
                                <div className="h-3 w-full animate-pulse rounded-md bg-muted"></div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Link href="/dashboard/employees" className="transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                            <p className="text-xs text-muted-foreground">Jumlah seluruh karyawan terdaftar</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/leave-schedule" className="transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Karyawan Cuti</CardTitle>
                            <CalendarOff className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.employeesOnLeave}</div>
                            <p className="text-xs text-muted-foreground">Jumlah karyawan yang sedang cuti</p>
                        </CardContent>
                    </Card>
                </Link>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Status Karyawan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                       <StatusItem icon={<UserCheck className="h-4 w-4 text-green-500" />} label="Aktif" value={stats.employeesByStatus.active} color="bg-green-100 text-green-800" />
                       <StatusItem icon={<UserX className="h-4 w-4 text-yellow-500" />} label="Non-Aktif" value={stats.employeesByStatus.nonaktif} color="bg-yellow-100 text-yellow-800" />
                       <StatusItem icon={<LogOut className="h-4 w-4 text-blue-500" />} label="Resign" value={stats.employeesByStatus.resign} color="bg-blue-100 text-blue-800" />
                       <StatusItem icon={<CircleSlash className="h-4 w-4 text-red-500" />} label="PHK" value={stats.employeesByStatus.phk} color="bg-red-100 text-red-800" />
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Karyawan Berdasarkan Jabatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead className="text-right">Jumlah Karyawan</TableHead>
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
                                            Tidak ada data jabatan.
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
                            Rekomendasi Cuti
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Karyawan aktif lebih dari 120 hari yang direkomendasikan untuk mengambil cuti.
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
            </div>
        </div>
    );
}
