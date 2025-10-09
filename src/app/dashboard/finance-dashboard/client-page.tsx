
'use client';

import { useState, useMemo } from 'react';
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
import { format } from 'date-fns';

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

export default function FinanceDashboardClientPage({
  payrollByProject,
  purchaseRequests,
  paymentRequests,
}: {
  payrollByProject: Record<string, number>;
  purchaseRequests: PurchaseRequest[];
  paymentRequests: PaymentRequest[];
}) {
    const totalPayroll = Object.values(payrollByProject).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Total Gaji Periode Ini</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatCurrency(totalPayroll)}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Total Biaya Pengadaan Barang</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatCurrency(purchaseRequests.reduce((sum, req) => sum + (req.proposedAmount || 0), 0))}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Total Pengajuan Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatCurrency(paymentRequests.reduce((sum, req) => sum + req.amount, 0))}</p>
                </CardContent>
            </Card>
        </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
                <CardTitle>Ringkasan Gaji per Proyek</CardTitle>
                <CardDescription>Total pembayaran gaji bersih per proyek untuk periode ini.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Proyek</TableHead>
                            <TableHead className="text-right">Total Gaji</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.keys(payrollByProject).length > 0 ? (
                            Object.entries(payrollByProject).map(([project, total]) => (
                                <TableRow key={project}>
                                    <TableCell>{project}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    Tidak ada data payroll untuk periode ini.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </ScrollArea>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Pengajuan Pembayaran Terbaru</CardTitle>
                <CardDescription>5 pengajuan pembayaran terakhir yang masuk.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {paymentRequests.slice(0, 5).map(req => (
                            <TableRow key={req.id}>
                                <TableCell>{format(new Date(req.requestDate), 'dd MMM')}</TableCell>
                                <TableCell>{req.paymentName}</TableCell>
                                <TableCell>{formatCurrency(req.amount)}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                            </TableRow>
                        ))}
                         {paymentRequests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Tidak ada pengajuan pembayaran.</TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Biaya Pengadaan Barang Terbaru</CardTitle>
                <CardDescription>5 pengajuan barang terakhir yang telah diproses.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Proyek</TableHead>
                            <TableHead>Nominal Diajukan</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {purchaseRequests.filter(pr => pr.status !== 'Pending').slice(0, 5).map(req => (
                            <TableRow key={req.id}>
                                <TableCell>{format(new Date(req.requestDate), 'dd MMM')}</TableCell>
                                <TableCell>{req.projectName}</TableCell>
                                <TableCell>{formatCurrency(req.proposedAmount)}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                            </TableRow>
                        ))}
                         {purchaseRequests.filter(pr => pr.status !== 'Pending').length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Tidak ada pengajuan barang yang diproses.</TableCell>
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
