

'use client';

import { useState, useMemo } from 'react';
import { format, parse } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PaymentRequest, PurchaseRequest, Site } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
    case 'Verified':
    case 'Approved by Purchasing':
    case 'Forwarded to Finance':
    case 'Approved': return 'default';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};

const calculateItemTotal = (items: PurchaseRequest['items']) => {
    return items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
};

export default function FinanceClientPage({
  paymentRequests,
  purchaseRequests,
  sites
}: {
  paymentRequests: PaymentRequest[];
  purchaseRequests: PurchaseRequest[];
  sites: Site[];
}) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [projectFilter, setProjectFilter] = useState('all');

  const filteredData = useMemo(() => {
    const targetMonth = period ? parse(period, 'yyyy-MM', new Date()).getMonth() : -1;
    const targetYear = period ? parse(period, 'yyyy-MM', new Date()).getFullYear() : -1;

    const filteredPurchaseRequests = purchaseRequests.filter(req => {
      const reqDate = new Date(req.requestDate);
      const matchesPeriod = period ? reqDate.getMonth() === targetMonth && reqDate.getFullYear() === targetYear : true;
      const matchesProject = projectFilter === 'all' || req.projectId === projectFilter;
      return matchesPeriod && matchesProject;
    });
    
    const filteredPaymentRequests = paymentRequests.filter(req => {
      const reqDate = new Date(req.requestDate);
      const matchesPeriod = period ? reqDate.getMonth() === targetMonth && reqDate.getFullYear() === targetYear : true;
      // Payment requests may not have projectId, so we don't filter them by project unless it's a requirement.
      return matchesPeriod;
    });

    const totalPurchaseRequest = filteredPurchaseRequests.reduce((sum, req) => {
      const amount = req.status === 'Approved by Purchasing' ? calculateItemTotal(req.items) : req.proposedAmount;
      return sum + (amount || 0);
    }, 0);

    const totalPaymentRequest = filteredPaymentRequests.reduce((sum, req) => sum + req.amount, 0);

    return {
      filteredPurchaseRequests,
      filteredPaymentRequests,
      totalPurchaseRequest,
      totalPaymentRequest,
    };
  }, [purchaseRequests, paymentRequests, period, projectFilter]);


  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Total Nominal Pengajuan Barang</CardTitle>
                    <CardDescription>Total nilai pengajuan barang berdasarkan filter di bawah.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatCurrency(filteredData.totalPurchaseRequest)}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Total Nominal Pengajuan Pembayaran</CardTitle>
                    <CardDescription>Total nilai pengajuan pembayaran berdasarkan filter di bawah.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatCurrency(filteredData.totalPaymentRequest)}</p>
                </CardContent>
            </Card>
        </div>
         <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <Input
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-auto"
                />
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Filter Proyek" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Proyek</SelectItem>
                        {sites.map(site => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </CardHeader>
        </Card>
        <Tabs defaultValue="purchasing">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="purchasing">Riwayat Pengajuan Barang</TabsTrigger>
                <TabsTrigger value="payment">Riwayat Pengajuan Pembayaran</TabsTrigger>
            </TabsList>
            <TabsContent value="purchasing">
                <Card>
                    <CardHeader>
                    <CardTitle>Riwayat Pengajuan Barang</CardTitle>
                    <CardDescription>Menampilkan riwayat pengajuan barang yang cocok dengan filter.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Proyek</TableHead>
                                <TableHead>Pemohon</TableHead>
                                <TableHead>Nominal Disetujui</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {filteredData.filteredPurchaseRequests.length > 0 ? (
                                filteredData.filteredPurchaseRequests.map((req) => {
                                    const approvedAmount = req.status === 'Approved by Purchasing'
                                        ? calculateItemTotal(req.items)
                                        : req.proposedAmount;
                                    
                                    return (
                                    <TableRow key={req.id}>
                                        <TableCell>{format(new Date(req.requestDate), 'PPP')}</TableCell>
                                        <TableCell>{req.projectName}</TableCell>
                                        <TableCell>{req.requesterName}</TableCell>
                                        <TableCell>{formatCurrency(approvedAmount)}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                                    </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Tidak ada data pengajuan barang.
                                </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="payment">
                <Card>
                    <CardHeader>
                    <CardTitle>Riwayat Pengajuan Pembayaran</CardTitle>
                    <CardDescription>Menampilkan riwayat pengajuan pembayaran yang cocok dengan filter.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Pemohon</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Nama Pembayaran</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {filteredData.filteredPaymentRequests.length > 0 ? (
                                filteredData.filteredPaymentRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{format(new Date(req.requestDate), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>{req.requesterName}</TableCell>
                                    <TableCell><Badge variant="outline">{req.category}</Badge></TableCell>
                                    <TableCell>{req.paymentName}</TableCell>
                                    <TableCell>{formatCurrency(req.amount)}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Tidak ada data pengajuan pembayaran.
                                </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
