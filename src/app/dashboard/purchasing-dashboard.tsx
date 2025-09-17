import { getPurchaseRequests } from "@/actions/purchasing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User, PurchaseRequest } from "@/lib/types";
import { CircleDollarSign, Files, GitPullRequest } from "lucide-react";
import { format } from 'date-fns';

async function getDashboardData() {
    const requests = await getPurchaseRequests({});
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const requestsThisMonth = requests.filter(req => {
        const reqDate = new Date(req.requestDate);
        return reqDate.getMonth() === currentMonth && reqDate.getFullYear() === currentYear;
    });

    const requestsByProject = requests.reduce((acc, req) => {
        const project = req.projectName || 'Tanpa Proyek';
        acc[project] = (acc[project] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusCounts = requests.reduce((acc, req) => {
        if (req.status === 'Verified by Purchasing' || req.status === 'Approved by Finance') {
            acc[req.status] = (acc[req.status] || 0) + 1;
        }
        return acc;
    }, {} as Record<'Verified by Purchasing' | 'Approved by Finance', number>);

    return {
        totalThisMonth: requestsThisMonth.length,
        requestsByProject: Object.entries(requestsByProject).sort((a,b) => b[1] - a[1]),
        statusCounts,
        recentRequests: requests.slice(0, 5), // Get 5 most recent requests
    };
}

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'Verified by Purchasing': return 'default';
    case 'Processing': return 'default';
    case 'Approved by Finance': return 'default';
    case 'Completed': return 'default';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};


export default async function PurchasingDashboard({ user }: { user: User }) {
    
    const data = await getDashboardData();
    
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pengajuan Bulan Ini</CardTitle>
                        <Files className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalThisMonth}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status Persetujuan</CardTitle>
                        <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Diverifikasi Purchasing:</span>
                                <Badge variant="secondary">{data.statusCounts['Verified by Purchasing'] || 0}</Badge>
                            </div>
                             <div className="flex justify-between">
                                <span>Disetujui Finance:</span>
                                 <Badge variant="default">{data.statusCounts['Approved by Finance'] || 0}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Pengajuan per Proyek</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Proyek</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.requestsByProject.map(([project, count]) => (
                                    <TableRow key={project}>
                                        <TableCell className="font-medium">{project}</TableCell>
                                        <TableCell className="text-right">{count}</TableCell>
                                    </TableRow>
                                ))}
                                {data.requestsByProject.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            Belum ada pengajuan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pengajuan Terbaru</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Proyek</TableHead>
                                    <TableHead>Total Estimasi</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {data.recentRequests.length > 0 ? (
                                    data.recentRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{format(new Date(req.requestDate), 'PPP')}</TableCell>
                                        <TableCell>{req.projectName}</TableCell>
                                        <TableCell>{formatCurrency(req.totalEstimatedPrice)}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Tidak ada pengajuan ditemukan.
                                    </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
