

'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
import type { PaymentRequest, PurchaseRequest } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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
}: {
  paymentRequests: PaymentRequest[];
  purchaseRequests: PurchaseRequest[];
}) {

  return (
    <Tabs defaultValue="purchasing">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchasing">Riwayat Pengajuan Barang</TabsTrigger>
            <TabsTrigger value="payment">Riwayat Pengajuan Pembayaran</TabsTrigger>
        </TabsList>
        <TabsContent value="purchasing">
            <Card>
                <CardHeader>
                <CardTitle>Riwayat Pengajuan Barang</CardTitle>
                <CardDescription>Menampilkan semua riwayat pengajuan barang dari semua proyek.</CardDescription>
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
                        {purchaseRequests.length > 0 ? (
                            purchaseRequests.map((req) => {
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
                <CardDescription>Menampilkan semua riwayat pengajuan pembayaran dari semua departemen.</CardDescription>
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
                        {paymentRequests.length > 0 ? (
                            paymentRequests.map(req => (
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
  );
}
