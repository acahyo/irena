

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User, Candidate } from '@/lib/types';
import { Users, UserCheck, UserPlus, Clock, CalendarDays } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, isAfter } from 'date-fns';
import QuickNikCheck from './quick-nik-check';
import { getEmployees } from '@/actions/employees';
import { getCandidates } from '@/actions/candidates';
import { Badge } from '@/components/ui/badge';


async function getDashboardData() {
    const [allEmployees, allCandidates] = await Promise.all([
        getEmployees(),
        getCandidates(),
    ]);

    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday

    const activeEmployeesCount = allEmployees.filter(e => e.employeeStatus === 'active').length;
    const pendingReviewCount = allEmployees.filter(e => e.employeeStatus === 'pending').length;
    
    const newThisWeekCount = allCandidates.filter(c => {
        const appliedDate = new Date(c.appliedDate);
        return isAfter(appliedDate, startOfThisWeek);
    }).length;
    
    const pendingCandidates = allCandidates.filter(c => c.status === 'Menunggu' || c.status === 'Interview');

    return {
        allEmployees,
        allCandidates,
        totalCandidates: allCandidates.length,
        activeEmployeesCount,
        pendingReviewCount,
        newThisWeekCount,
        pendingCandidates,
    };
}

export default async function RecruitmentDashboard({ user }: { user: User }) {
    const data = await getDashboardData();

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Kandidat</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalCandidates}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Kandidat Baru (Minggu Ini)</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.newThisWeekCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Menunggu Verifikasi HR</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.pendingReviewCount}</div>
                    </CardContent>
                </Card>
            </div>
            
            <QuickNikCheck allEmployees={data.allEmployees} allCandidates={data.allCandidates} />

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Kandidat Sedang Diproses</CardTitle>
                            <CardDescription>Daftar calon karyawan yang menunggu interview atau verifikasi lebih lanjut.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/dashboard/recruitment/candidates">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Kelola Data Kandidat
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
                                    <TableHead>Posisi Dilamar</TableHead>
                                    <TableHead>Tanggal Melamar</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.pendingCandidates.length > 0 ? (
                                    data.pendingCandidates.map(candidate => (
                                        <TableRow key={candidate.id}>
                                            <TableCell className="font-medium">{candidate.name}</TableCell>
                                            <TableCell>{candidate.positionApplied}</TableCell>
                                            <TableCell>{format(new Date(candidate.appliedDate), 'PPP')}</TableCell>
                                            <TableCell><Badge variant="secondary">{candidate.status}</Badge></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Tidak ada kandidat yang sedang diproses.
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
