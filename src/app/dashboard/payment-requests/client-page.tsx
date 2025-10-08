
'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { PaymentRequest, User } from '@/lib/types';
import { createPaymentRequest, updatePaymentRequestStatus } from '@/actions/payment-requests';
import { useUser } from '@/contexts/user-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2, Eye, Check, X, Upload } from 'lucide-react';

const formatCurrency = (amount?: number) => {
  if (amount === undefined) return 'N/A';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'Approved': return 'default';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};

const FormSchema = z.object({
  category: z.enum(['ID CARD', 'SIMPER', 'Denda', 'Sewa', 'BPJS']),
  paymentName: z.string().min(1, 'Nama pembayaran harus diisi'),
  amount: z.coerce.number().min(1, 'Total pembayaran harus diisi'),
  paymentType: z.enum(['Cash', 'Transfer']).optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  documentDataUri: z.string().optional(),
  paymentPeriod: z.string().optional(),
  billingCode: z.string().optional(),
});


export default function PaymentRequestsClientPage({ initialRequests }: { initialRequests: PaymentRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const user = useUser();
  const router = useRouter();
  
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { paymentName: '', amount: 0 }
  });

  const category = watch('category');

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!user) return;
    startTransition(async () => {
        const result = await createPaymentRequest({ ...data, requesterId: user.id, requesterName: user.name });
        if (result.success) {
            toast({ title: 'Sukses', description: 'Pengajuan pembayaran berhasil dikirim.' });
            setRequests(prev => [result.newRequest!, ...prev]);
            setIsNewRequestOpen(false);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  }
  
  const handleStatusUpdate = (status: 'Approved' | 'Rejected') => {
      if(!selectedRequest) return;
      startTransition(async () => {
          const result = await updatePaymentRequestStatus(selectedRequest.id, status, user?.id || '', user?.name || '');
          if (result.success) {
              toast({ title: 'Sukses', description: `Status pengajuan berhasil diubah menjadi ${status}` });
              setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {...r, status} : r));
              setIsDetailOpen(false);
          } else {
              toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status.' });
          }
      });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pengajuan Pembayaran</CardTitle>
              <CardDescription>Ajukan dan kelola berbagai jenis pembayaran.</CardDescription>
            </div>
            <Button onClick={() => setIsNewRequestOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Buat Pengajuan</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Nama Pembayaran</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>{format(new Date(req.requestDate), 'dd MMM yyyy')}</TableCell>
                  <TableCell>{req.requesterName}</TableCell>
                  <TableCell><Badge variant="outline">{req.category}</Badge></TableCell>
                  <TableCell>{req.paymentName}</TableCell>
                  <TableCell>{formatCurrency(req.amount)}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedRequest(req); setIsDetailOpen(true); }}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Form Pengajuan Pembayaran</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller name="category" control={control} render={({ field }) => (
                <div className="space-y-2">
                    <Label>Kategori Pembayaran</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ID CARD">ID CARD</SelectItem>
                            <SelectItem value="SIMPER">SIMPER</SelectItem>
                            <SelectItem value="Denda">Denda</SelectItem>
                            <SelectItem value="Sewa">Sewa</SelectItem>
                            <SelectItem value="BPJS">BPJS</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )} />
            
            <div className="space-y-2"><Label>Nama Pembayaran</Label><Input {...register('paymentName')} /></div>
            <div className="space-y-2"><Label>Total Pembayaran</Label><Input type="number" {...register('amount')} /></div>
            
            {category === 'BPJS' && <>
                <div className="space-y-2"><Label>Periode Pembayaran</Label><Input type="month" {...register('paymentPeriod')} /></div>
                <div className="space-y-2"><Label>Kode Tagihan</Label><Input {...register('billingCode')} /></div>
            </>}
            
            {(category === 'ID CARD' || category === 'SIMPER' || category === 'Denda') && 
              <Controller name="paymentType" control={control} render={({ field }) => (
                  <div className="space-y-2">
                      <Label>Tipe Pembayaran</Label>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger><SelectValue placeholder="Pilih tipe..." /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Transfer">Transfer</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              )} />
            }
            
            {watch('paymentType') === 'Transfer' && (category === 'ID CARD' || category === 'SIMPER' || category === 'Denda' || category === 'Sewa') && <>
                <div className="space-y-2"><Label>Nomor Rekening</Label><Input {...register('accountNumber')} /></div>
                <div className="space-y-2"><Label>Nama Rekening</Label><Input {...register('accountName')} /></div>
            </>}

            {(category === 'Denda' || category === 'Sewa') && 
               <Controller name="documentDataUri" control={control} render={({ field }) => (
                  <div className="space-y-2">
                      <Label>Dokumen (Wajib)</Label>
                      <Input type="file" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                              const reader = new FileReader();
                              reader.onload = (readEvent) => field.onChange(readEvent.target?.result as string);
                              reader.readAsDataURL(file);
                          }
                      }} />
                  </div>
              )} />
            }
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kirim</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Detail Pengajuan #{selectedRequest?.id.substring(0,6)}</DialogTitle></DialogHeader>
            <div className="space-y-2">
                <p><strong>Pemohon:</strong> {selectedRequest?.requesterName}</p>
                <p><strong>Tanggal:</strong> {selectedRequest && format(new Date(selectedRequest.requestDate), 'dd MMM yyyy')}</p>
                <p><strong>Kategori:</strong> {selectedRequest?.category}</p>
                <p><strong>Nama:</strong> {selectedRequest?.paymentName}</p>
                <p><strong>Total:</strong> {formatCurrency(selectedRequest?.amount)}</p>
                {selectedRequest?.paymentType && <p><strong>Tipe:</strong> {selectedRequest.paymentType}</p>}
                {selectedRequest?.accountNumber && <p><strong>No. Rek:</strong> {selectedRequest.accountNumber} (a/n {selectedRequest.accountName})</p>}
                {selectedRequest?.documentUrl && <p><strong>Dokumen:</strong> <a href={selectedRequest.documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Lihat</a></p>}
            </div>
            {user && (user.role === 'Finance' || user.role === 'Administrator') && selectedRequest?.status === 'Pending' &&
                <DialogFooter>
                    <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isPending}><X className="mr-2 h-4 w-4" /> Tolak</Button>
                    <Button onClick={() => handleStatusUpdate('Approved')} disabled={isPending}><Check className="mr-2 h-4 w-4" /> Setujui</Button>
                </DialogFooter>
            }
        </DialogContent>
      </Dialog>
    </>
  );
}
