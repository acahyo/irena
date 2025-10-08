'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { FinanceRecord, PaymentRequest, PurchaseRequest, User } from '@/lib/types';
import { Check, X, Eye, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { updatePaymentRequestStatus } from '@/actions/payment-requests';
import Link from 'next/link';
import { updatePurchaseRequest } from '@/actions/purchasing';

type ApprovalItem = (PaymentRequest & { type: 'payment' }) | (PurchaseRequest & { type: 'purchase' });


const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function FinanceClientPage({
  pendingApprovals,
  financeLog,
}: {
  pendingApprovals: ApprovalItem[];
  financeLog: FinanceRecord[];
}) {
  const [requests, setRequests] = useState(pendingApprovals);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const user = useUser();
  const router = useRouter();

  const handleStatusUpdate = (status: 'Approved' | 'Rejected') => {
      if(!selectedRequest || !user) return;
      startTransition(async () => {
          try {
             if (selectedRequest.type === 'payment') {
                await updatePaymentRequestStatus(selectedRequest.id, status, user.id, user.name);
             } else { // type is 'purchase'
                await updatePurchaseRequest(selectedRequest.id, { status });
             }
              toast({ title: 'Sukses', description: `Status pengajuan berhasil diubah menjadi ${status}` });
              setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
              setIsDetailOpen(false);
              router.refresh(); // Refresh to see the new record in finance log
          } catch(err) {
              toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status.' });
          }
      });
  }

  const { totalIncome, totalExpense, netTotal } = useMemo(() => {
    const income = financeLog.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expense = financeLog.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    return {
      totalIncome: income,
      totalExpense: expense,
      netTotal: income - expense,
    };
  }, [financeLog]);
  
  const sortedRequests = useMemo(() => {
    return requests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }, [requests]);

  const renderApprovalDetails = () => {
      if (!selectedRequest) return null;

      if (selectedRequest.type === 'payment') {
          return (
             <div className="space-y-2 py-4">
                  <p><strong>Tipe:</strong> Pengajuan Pembayaran</p>
                  <p><strong>Pemohon:</strong> {selectedRequest.requesterName}</p>
                  <p><strong>Tanggal:</strong> {format(new Date(selectedRequest.requestDate), 'dd MMM yyyy')}</p>
                  <p><strong>Kategori:</strong> {selectedRequest.category}</p>
                  <p><strong>Nama:</strong> {selectedRequest.paymentName}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedRequest.amount)}</p>
                  {selectedRequest.paymentType && <p><strong>Tipe Bayar:</strong> {selectedRequest.paymentType}</p>}
                  {selectedRequest.accountNumber && <p><strong>No. Rek:</strong> {selectedRequest.accountNumber} (a/n {selectedRequest.accountName})</p>}
                  {selectedRequest.documentUrl && <p><strong>Dokumen:</strong> <Link href={selectedRequest.documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Lihat Dokumen</Link></p>}
              </div>
          )
      } else { // type is 'purchase'
          return (
             <div className="space-y-4 py-4">
                 <p><strong>Tipe:</strong> Pengajuan Barang</p>
                 <p><strong>Pemohon:</strong> {selectedRequest.requesterName}</p>
                 <p><strong>Proyek:</strong> {selectedRequest.projectName}</p>
                 <p><strong>Tanggal:</strong> {format(new Date(selectedRequest.requestDate), 'dd MMM yyyy')}</p>
                 <p><strong>Total Diajukan:</strong> {formatCurrency(selectedRequest.proposedAmount)}</p>
                 <div>
                    <h4 className="font-semibold">Barang:</h4>
                    <ul className="list-disc list-inside">
                        {selectedRequest.items.map((item, index) => <li key={index}>{item.name} (x{item.quantity})</li>)}
                    </ul>
                 </div>
              </div>
          )
      }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netTotal >= 0 ? 'text-blue-600' : 'text-destructive'}`}>{formatCurrency(netTotal)}</div>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Persetujuan Keuangan</CardTitle>
          <CardDescription>Tinjau dan setujui pengajuan yang masuk dari semua departemen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRequests.length > 0 ? (
                sortedRequests.map((req) => (
                  <TableRow key={`${req.type}-${req.id}`}>
                    <TableCell>{format(new Date(req.requestDate), 'PPP')}</TableCell>
                     <TableCell>
                      {req.type === 'payment' ? <Badge>Pembayaran</Badge> : <Badge variant="secondary">Barang</Badge>}
                    </TableCell>
                    <TableCell>{req.requesterName}</TableCell>
                    <TableCell className="font-medium">
                        {req.type === 'payment' ? `${req.paymentName} (${req.category})` : `Pembelian untuk ${req.projectName}`}
                    </TableCell>
                    <TableCell>{formatCurrency(req.type === 'payment' ? req.amount : req.proposedAmount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedRequest(req); setIsDetailOpen(true); }}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Tidak ada pengajuan yang menunggu persetujuan.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Rekapitulasi Pengeluaran</CardTitle>
          <CardDescription>Semua transaksi pengeluaran yang telah disetujui.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Proyek</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financeLog.filter(r => r.type === 'expense').length > 0 ? (
                financeLog.filter(r => r.type === 'expense').map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
                    <TableCell>{record.projectName}</TableCell>
                    <TableCell className="font-medium">{record.description}</TableCell>
                    <TableCell><Badge variant="secondary">{record.category}</Badge></TableCell>
                    <TableCell className='text-right font-semibold text-red-600'>{formatCurrency(record.amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Belum ada catatan pengeluaran.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Detail Pengajuan</DialogTitle></DialogHeader>
            {renderApprovalDetails()}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Tutup</Button>
                <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <X className="mr-2 h-4 w-4" /> Tolak
                </Button>
                <Button onClick={() => handleStatusUpdate('Approved')} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <Check className="mr-2 h-4 w-4" /> Setujui
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
