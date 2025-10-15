import { getPurchaseRequests } from "@/actions/purchasing";
import { getPaymentRequests } from "@/actions/payment-requests";
import { getSites } from "@/actions/sites";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User, PurchaseRequest, PaymentRequest } from "@/lib/types";
import { CircleDollarSign, Files, GitPullRequest, Eye } from "lucide-react";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import FinanceCharts from "./finance-charts";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getDashboardData() {
    const [purchaseRequests, paymentRequests, sites] = await Promise.all([
        getPurchaseRequests({}),
        getPaymentRequests({}),
        getSites()
    ]);
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const pendingPurchaseRequests = purchaseRequests.filter(req => req.status === 'Forwarded to Finance');
    const pendingPaymentRequests = paymentRequests.filter(req => req.status === 'Pending');

    const totalPending = pendingPurchaseRequests.length + pendingPaymentRequests.length;

    const approvedThisMonth = purchaseRequests
        .filter(req => {
            const approvedDate = req.approvedDate ? new Date(req.approvedDate) : null;
            return req.status === 'Approved' && approvedDate && approvedDate.getMonth() === currentMonth && approvedDate.getFullYear() === currentYear;
        })
        .reduce((sum, req) => sum + (req.proposedAmount || 0), 0);

    const expensesByProject = sites.map(site => {
        const projectPurchases = purchaseRequests
            .filter(req => req.projectId === site.id && req.status === 'Approved')
            .reduce((sum, req) => sum + (req.proposedAmount || 0), 0);
        
        // Assuming payment requests can be linked to projects somehow, if not, this part needs adjustment
        // For now, we only calculate based on purchase requests
        return {
            name: site.name,
            total: projectPurchases,
        };
    }).filter(p => p.total > 0);

    return {
        totalRequests: purchaseRequests.length + paymentRequests.length,
        totalPending,
        approvedThisMonth,
        expensesByProject,
        recentPurchaseRequests: pendingPurchaseRequests.slice(0, 5),
        recentPaymentRequests: pendingPaymentRequests.slice(0, 5)
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
    case 'Pending':
    case 'Forwarded to Finance':
        return 'secondary';
    case 'Approved': return 'default';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};


export default async function FinanceDashboard({ user }: { user: User }) {
    
    const data = await getDashboardData();
    
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
                        <Files className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalRequests}</div>
                        <p className="text-xs text-muted-foreground">Total pengajuan barang & pembayaran</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
                        <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalPending}</div>
                        <p className="text-xs text-muted-foreground">Pengajuan yang perlu diproses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.approvedThisMonth)}</div>
                        <p className="text-xs text-muted-foreground">Total nominal yang disetujui bulan ini</p>
                    </CardContent>
                </Card>
            </div>
            
            <FinanceCharts expenseData={data.expensesByProject} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Pengajuan Barang Terbaru</CardTitle>
                        <CardDescription>Pengajuan dari purchasing yang menunggu persetujuan.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Proyek</TableHead>
                                    <TableHead>Nominal</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {data.recentPurchaseRequests.length > 0 ? (
                                    data.recentPurchaseRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{req.projectName}</div>
                                            <div className="text-xs text-muted-foreground">{format(new Date(req.requestDate), 'dd MMM yyyy')}</div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(req.proposedAmount)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href="/dashboard/purchasing"><Eye className="mr-2 h-4 w-4" /> Lihat</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            Tidak ada pengajuan barang.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Pengajuan Pembayaran Terbaru</CardTitle>
                         <CardDescription>Pengajuan pembayaran umum yang perlu diproses.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Nominal</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {data.recentPaymentRequests.length > 0 ? (
                                    data.recentPaymentRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{req.paymentName}</div>
                                            <div className="text-xs text-muted-foreground">{req.category}</div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(req.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href="/dashboard/payment-requests"><Eye className="mr-2 h-4 w-4" /> Lihat</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        Tidak ada pengajuan pembayaran.
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
