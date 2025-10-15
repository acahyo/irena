'use client';

import { useState, useMemo, useTransition } from 'react';
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
import type { KoperasiOrder } from '@/lib/types';
import { updateKoperasiOrder } from '@/actions/koperasi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Loader2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import Image from 'next/image';

type KoperasiOrderWithEmployee = KoperasiOrder & { employeeAvatar?: string; employeePosition?: string };

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const getStatusVariant = (status: KoperasiOrder['status']) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'Approved': return 'default';
    case 'Ready for Pickup': return 'default';
    case 'Completed': return 'default';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};

export default function KoperasiOrdersClientPage({ initialOrders }: { initialOrders: KoperasiOrderWithEmployee[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<KoperasiOrderWithEmployee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  // State for the modal form
  const [newStatus, setNewStatus] = useState<KoperasiOrder['status'] | ''>('');
  const [pickupDay, setPickupDay] = useState('');
  const [pickupDate, setPickupDate] = useState<Date | undefined>();
  const [pickupLocation, setPickupLocation] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);

  const handleOpenDialog = (order: KoperasiOrderWithEmployee) => {
    setSelectedOrder(order);
    setNewStatus('');
    setPickupDay(order.pickupInfo?.day || '');
    setPickupDate(order.pickupInfo?.date ? new Date(order.pickupInfo.date) : undefined);
    setPickupLocation(order.pickupInfo?.location || '');
    setRejectionReason(order.rejectionReason || '');
    setCompletionPhoto(order.completionPhotoUrl || null);
    setIsDialogOpen(true);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
        const reader = new FileReader();
        reader.onloadend = () => setCompletionPhoto(reader.result as string);
        reader.readAsDataURL(file);
    }
  };

  const handleSubmitStatusUpdate = () => {
    if (!selectedOrder || !newStatus) return;

    startTransition(async () => {
        const updates: Partial<KoperasiOrder> = { status: newStatus };
        
        if (newStatus === 'Ready for Pickup') {
            updates.pickupInfo = { day: pickupDay, date: pickupDate!, location: pickupLocation };
        }
        if (newStatus === 'Rejected') {
            updates.rejectionReason = rejectionReason;
        }
        if (newStatus === 'Completed') {
            updates.completionPhotoUrl = completionPhoto || '';
        }

        try {
            await updateKoperasiOrder(selectedOrder.id, updates);
            toast({ title: 'Sukses!', description: 'Status pesanan berhasil diperbarui.' });
            setIsDialogOpen(false);
            router.refresh();
        } catch(err) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status pesanan.' });
        }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pesanan Koperasi</CardTitle>
          <CardDescription>Kelola pesanan yang masuk dari karyawan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Total Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{format(new Date(order.orderDate), 'PPP')}</TableCell>
                    <TableCell className="font-medium">{order.employeeName}</TableCell>
                    <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(order.status)}>{order.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(order)}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Belum ada pesanan.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
              <DialogHeader>
                  <DialogTitle>Detail Pesanan #{selectedOrder?.id.substring(0, 6)}</DialogTitle>
                  <DialogDescription>Dipesan oleh {selectedOrder?.employeeName} pada {selectedOrder && format(new Date(selectedOrder.orderDate), 'PPP')}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <h4 className="font-semibold mb-2">Item Pesanan</h4>
                    <ul className="space-y-2">
                        {selectedOrder?.items.map(item => (
                            <li key={item.itemId} className="flex justify-between text-sm">
                                <span>{item.name} (x{item.quantity})</span>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                            </li>
                        ))}
                    </ul>
                    <hr className="my-2"/>
                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(selectedOrder?.totalPrice || 0)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Proses Pesanan</h4>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Ubah Status</Label>
                            <Select onValueChange={(val) => setNewStatus(val as KoperasiOrder['status'])}>
                                <SelectTrigger><SelectValue placeholder="Pilih status baru..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Approved">Disetujui</SelectItem>
                                    <SelectItem value="Ready for Pickup">Barang Dapat Diambil</SelectItem>
                                    <SelectItem value="Completed">Selesai</SelectItem>
                                    <SelectItem value="Rejected">Ditolak</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {newStatus === 'Ready for Pickup' && (
                            <div className="space-y-3 p-3 border rounded-md">
                                <h5 className="text-sm font-medium">Info Pengambilan</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input placeholder="Hari, e.g., Senin" value={pickupDay} onChange={e => setPickupDay(e.target.value)} />
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" className={cn("justify-start text-left font-normal", !pickupDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />{pickupDate ? format(pickupDate, 'PPP') : <span>Tanggal</span>}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={pickupDate} onSelect={setPickupDate} initialFocus /></PopoverContent>
                                  </Popover>
                                </div>
                                <Input placeholder="Lokasi Pengambilan" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} />
                            </div>
                        )}
                        {newStatus === 'Rejected' && (
                            <Textarea placeholder="Alasan penolakan..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
                        )}
                        {newStatus === 'Completed' && (
                             <div className="space-y-2">
                                <Label>Foto Dokumentasi Pengambilan</Label>
                                <div className="flex items-center gap-4">
                                    {completionPhoto && <Image src={completionPhoto} alt="Preview" width={96} height={96} className="rounded-md object-cover" />}
                                    <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-sm" />
                                </div>
                             </div>
                        )}
                    </div>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                  <Button onClick={handleSubmitStatusUpdate} disabled={isPending || !newStatus}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Perbarui Status
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
