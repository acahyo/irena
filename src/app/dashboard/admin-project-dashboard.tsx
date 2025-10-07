
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getEmployees } from '@/actions/employees';
import { getPurchaseRequests } from '@/actions/purchasing';
import { getLeaveRequests } from '@/actions/leave';
import { getSite } from '@/actions/sites';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User, Employee, PurchaseRequest, Site, LeaveRequest } from '@/lib/types';
import { Building, Users, UserPlus, ListChecks, UserRound } from 'lucide-react';
import NewPurchaseRequestForm from './new-purchase-request-form';
import ProjectPurchaseRequests from './project-purchase-requests';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { differenceInDays } from 'date-fns';

type DashboardData = {
    site: Site | null;
    employees: Employee[];
    purchaseRequests: PurchaseRequest[];
    employeesByPosition: { name: string, value: number }[];
    leaveRecommendation: (Employee & { daysActive: number })[];
}

async function getProjectDashboardData(siteId?: string, shiftName?: string): Promise<DashboardData> {
    if (!siteId) {
        return { site: null, employees: [], purchaseRequests: [], employeesByPosition: [], leaveRecommendation: [] };
    }
    
    const [site, employees, purchaseRequests, leaveRequests] = await Promise.all([
        getSite(siteId),
        getEmployees({ siteId, shiftName }),
        getPurchaseRequests({ siteId }),
        getLeaveRequests({ siteId }),
    ]);

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
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaveRecommendation = employees
        .filter(emp => emp.employeeStatus === 'active')
        .map(emp => {
            const lastApprovedLeave = leaveRequests
                .filter(req => req.employeeId === emp.id && req.status === 'Approved')
                .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
            
            const referenceDate = lastApprovedLeave ? new Date(lastApprovedLeave.endDate) : (emp.contractStartDate ? new Date(emp.contractStartDate) : null);

            if (!referenceDate) return null;

            const daysActive = differenceInDays(today, referenceDate);
            return { ...emp, daysActive };
        })
        .filter((emp): emp is Employee & { daysActive: number } => emp !== null && emp.daysActive >= 120);


    return {
        site,
        employees,
        purchaseRequests,
        employeesByPosition: employeesByPosition.sort((a,b) => b.value - a.value),
        leaveRecommendation,
    };
}

export default function AdminProjectDashboard({ user, assignedSites, currentProjectId }: { user: User, assignedSites: Site[], currentProjectId?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [data, setData] = useState<DashboardData | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId || assignedSites[0]?.id || '');
    
    useEffect(() => {
        const fetchData = async () => {
            if (selectedProjectId) {
                const shiftFilter = user.shiftAccess === 'assigned' ? user.shiftName : undefined;
                const dashboardData = await getProjectDashboardData(selectedProjectId, shiftFilter);
                setData(dashboardData);
            } else {
                setData({ site: null, employees: [], purchaseRequests: [], employeesByPosition: [], leaveRecommendation: [] });
            }
        };

        fetchData();
    }, [selectedProjectId, user]);

    const handleProjectChange = (projectId: string) => {
        setSelectedProjectId(projectId);
        const params = new URLSearchParams(searchParams.toString());
        params.set('projectId', projectId);
        router.push(`/dashboard?${params.toString()}`);
    };

    if (assignedSites.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Anda tidak ditugaskan ke proyek manapun. Silakan hubungi Administrator.</p>
                </CardContent>
            </Card>
        )
    }

    if (!data || !data.site) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Memuat Data Proyek...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Silakan tunggu...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Building /> {data.site.name}</CardTitle>
                        <CardDescription>Dasbor untuk Admin Proyek. PIC: {data.site.picName || 'N/A'}</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Pilih Proyek" />
                            </SelectTrigger>
                            <SelectContent>
                                {assignedSites.map(site => (
                                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button asChild>
                            <Link href="/dashboard/employees/register">
                                <UserPlus className="mr-2 h-4 w-4" /> Daftarkan Karyawan
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
            </Card>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Karyawan di Proyek</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.employees.length}</div>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Karyawan Berdasarkan Jabatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.employeesByPosition.map((pos) => (
                                    <TableRow key={pos.name}>
                                        <TableCell className="font-medium">{pos.name}</TableCell>
                                        <TableCell className="text-right">{pos.value}</TableCell>
                                    </TableRow>
                                ))}
                                {data.employeesByPosition.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            Tidak ada data jabatan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <NewPurchaseRequestForm user={user} site={data.site} />
                <ProjectPurchaseRequests initialRequests={data.purchaseRequests} />
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
    )
}
