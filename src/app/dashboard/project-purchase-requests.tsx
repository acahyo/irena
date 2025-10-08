
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PurchaseRequest } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'Verified': return 'default';
    case 'Approved': return 'default';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ProjectPurchaseRequests({ initialRequests }: { initialRequests: PurchaseRequest[] }) {
    const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleViewDetails = (request: PurchaseRequest) => {
        setSelectedRequest(request);
        setIsDetailOpen(true);
    };


  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Status Pengajuan</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Harga Barang</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialRequests.length > 0 ? (
                initialRequests.map((req) => (
                  <TableRow key={req.id} onClick={() => handleViewDetails(req)} className="cursor-pointer">
                    <TableCell>{format(new Date(req.requestDate), 'PPP')}</TableCell>
                     <TableCell>
                      {req.items[0]?.name}
                      {req.items.length > 1 && ` (+${req.items.length - 1} lainnya)`}
                    </TableCell>
                    <TableCell>{formatCurrency(req.items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0))}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Belum ada riwayat pengajuan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>

    <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        {selectedRequest && (
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detail Pengajuan #{selectedRequest.id.substring(0, 6)}</DialogTitle>
                    <DialogDescription>
                        Status Saat Ini: <Badge variant={getStatusVariant(selectedRequest.status)}>{selectedRequest.status}</Badge>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div>
                        <h4 className="font-semibold mb-2">Item yang Diajukan</h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Barang</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedRequest.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="space-y-1">
                        <h4 className="font-semibold">Nominal Diajukan oleh Purchasing</h4>
                        <p className="text-lg font-bold">{formatCurrency(selectedRequest.proposedAmount)}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Riwayat Proses</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between"><span>Dibuat:</span> <span>{format(new Date(selectedRequest.requestDate), 'PPP, HH:mm')}</span></li>
                            <li className="flex justify-between"><span>Diverifikasi Purchasing:</span> <span>{selectedRequest.verifiedDate ? format(new Date(selectedRequest.verifiedDate), 'PPP, HH:mm') : '-'}</span></li>
                            <li className="flex justify-between"><span>Disetujui Finance:</span> <span>{selectedRequest.approvedDate ? format(new Date(selectedRequest.approvedDate), 'PPP, HH:mm') : '-'}</span></li>
                        </ul>
                    </div>

                    {selectedRequest.status === 'Rejected' && selectedRequest.rejectionReason && (
                         <div>
                            <h4 className="font-semibold text-destructive">Alasan Penolakan</h4>
                            <p className="text-sm text-destructive p-2 border border-destructive/50 bg-destructive/10 rounded-md">{selectedRequest.rejectionReason}</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={() => setIsDetailOpen(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        )}
    </Dialog>
    </>
  );
}
