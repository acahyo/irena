
'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PurchaseRequest } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  return (
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
                <TableHead>Nominal Diajukan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialRequests.length > 0 ? (
                initialRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{format(new Date(req.requestDate), 'PPP')}</TableCell>
                    <TableCell>{formatCurrency(req.proposedAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Belum ada riwayat pengajuan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
