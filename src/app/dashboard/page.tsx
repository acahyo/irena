
'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, CalendarOff, Loader2 } from 'lucide-react';
import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import type { Employee } from '@/lib/types';

const COLORS = ['#136F63', '#877795', '#A29F85', '#C4B79A', '#EAE0C1', '#F7EDE2'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="font-bold">{`${payload[0].name}`}</p>
                <p className="text-sm text-muted-foreground">{`Jumlah: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};


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
                            <PieChart>
                                <Pie
                                    data={stats.employeesByPosition}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {stats.employeesByPosition.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconSize={10} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
