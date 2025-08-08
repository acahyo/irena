
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, CalendarOff, Loader2 } from 'lucide-react';
import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import type { Employee, LeaveRequest } from '@/lib/types';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        employeesOnLeave: 0,
        employeesByPosition: [] as { name: string, value: number }[],
    });
    const [loading, setLoading] = useState(true);

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

                setStats({
                    totalEmployees: employees.length,
                    employeesOnLeave: approvedLeave.length,
                    employeesByPosition: employeesByPosition.sort((a,b) => b.value - a.value),
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

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                        <p className="text-xs text-muted-foreground">Jumlah seluruh karyawan terdaftar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Karyawan Cuti</CardTitle>
                        <CalendarOff className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.employeesOnLeave}</div>
                        <p className="text-xs text-muted-foreground">Jumlah karyawan yang sedang cuti</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Jabatan</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.employeesByPosition.length}</div>
                        <p className="text-xs text-muted-foreground">Jumlah jabatan yang ada</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Karyawan Berdasarkan Jabatan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.employeesByPosition} layout="vertical" margin={{ left: 20, right: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={150} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                />
                                <Tooltip
                                  cursor={{ fill: 'hsl(var(--secondary))' }}
                                  content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                            <div className="flex flex-col space-y-1">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Jabatan
                                                </span>
                                                <span className="font-bold text-muted-foreground">
                                                {payload[0].payload.name}
                                                </span>
                                            </div>
                                            <div className="flex flex-col space-y-1">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Jumlah
                                                </span>
                                                <span className="font-bold">
                                                {payload[0].value}
                                                </span>
                                            </div>
                                            </div>
                                        </div>
                                        )
                                    }
                                    return null
                                  }}
                                />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
