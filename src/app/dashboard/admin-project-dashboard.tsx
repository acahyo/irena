import { getEmployees } from '@/actions/employees';
import { getPurchaseRequests } from '@/actions/purchasing';
import { getSite } from '@/actions/sites';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User, Employee, PurchaseRequest } from '@/lib/types';
import { Building, Users } from 'lucide-react';
import NewPurchaseRequestForm from './new-purchase-request-form';
import ProjectPurchaseRequests from './project-purchase-requests';

async function getProjectDashboardData(siteId?: string) {
    if (!siteId) {
        return {
            site: null,
            employees: [],
            purchaseRequests: [],
            employeesByPosition: [],
        };
    }
    
    const [site, employees, purchaseRequests] = await Promise.all([
        getSite(siteId),
        getEmployees({ siteId }),
        getPurchaseRequests({ siteId }),
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

    return {
        site,
        employees,
        purchaseRequests,
        employeesByPosition: employeesByPosition.sort((a,b) => b.value - a.value),
    };
}


export default async function AdminProjectDashboard({ user }: { user: User }) {

    const data = await getProjectDashboardData(user.siteId);

    if (!data.site) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Proyek tidak ditemukan atau Anda tidak ditugaskan ke proyek manapun. Silakan hubungi Administrator.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building /> {data.site.name}</CardTitle>
                    <CardDescription>Dasbor untuk Admin Proyek. PIC: {data.site.picName || 'N/A'}</CardDescription>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NewPurchaseRequestForm user={user} site={data.site} />
                <ProjectPurchaseRequests initialRequests={data.purchaseRequests} />
            </div>
        </div>
    )
}
