

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
import type { PurchaseRequest, PurchaseRequestItem, Employee, Site } from '@/lib/types';
import { createPurchaseRequest, deletePurchaseRequest } from '@/actions/purchasing';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Loader2, Eye } from 'lucide-react';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'Verified by Purchasing': return 'default';
    case 'Processing': return 'default';
    case 'Approved by Finance': return 'default';
    case 'Ready for Pickup': return 'default';
    case 'Completed': return 'default';
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

export default function MyPurchasingClientPage({
  initialRequests,
  employee,
  site
}: {
  initialRequests: PurchaseRequest[];
  employee: Employee;
  site: Site;
}) {
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  const handleViewDetails = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };


  const NewRequestForm = () => {
    const [items, setItems] = useState<Partial<PurchaseRequestItem>[]>([{ name: '', quantity: 1, unit: '' }]);

    const handleItemChange = (index: number, field: keyof PurchaseRequestItem, value: string) => {
      const newItems = [...items];
      const numValue = ['quantity'].includes(field) ? Number(value) : value;
      (newItems[index] as any)[field] = numValue;
      setItems(newItems);
    };

    const addItem = () => setItems([...items, { name: '', quantity: 1, unit: '' }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      
      const validItems = items.filter(item => item.name && item.quantity && item.unit);
      if (validItems.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Mohon isi setidaknya satu barang.' });
        return;
      }
      
      startTransition(async () => {
        try {
          const requestData = {
            requesterId: employee.id,
            requesterName: employee.name,
            projectId: site.id,
            projectName: site.name,
            items: validItems as PurchaseRequestItem[],
          };
          await createPurchaseRequest(requestData);
          toast({ title: 'Sukses!', description: 'Pengajuan barang berhasil dikirim.' });
          setIsNewRequestDialogOpen(false);
          router.push('/portal/purchasing');
          router.refresh();
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengirim pengajuan.' });
        }
      });
    };
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md">
                    <div className="col-span-7 space-y-1">
                        <Label htmlFor={`name-${index}`} className="text-xs">Nama Barang</Label>
                        <Input id={`name-${index}`} value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} required />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <Label htmlFor={`quantity-${index}`} className="text-xs">Jumlah</Label>
                        <Input id={`quantity-${index}`} type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required min={1} />
                    </div>
                     <div className="col-span-3 space-y-1">
                        <Label htmlFor={`unit-${index}`} className="text-xs">Unit</Label>
                        <Input id={`unit-${index}`} value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} required placeholder="e.g. pcs, kg" />
                    </div>
                </div>
            ))}
        </div>
        <div className="flex justify-between items-center">
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Barang
            </Button>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewRequestDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kirim Pengajuan
                </Button>
            </DialogFooter>
        </div>
      </form>
    );
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
        try {
            await deletePurchaseRequest(id);
            toast({ title: 'Sukses!', description: 'Pengajuan telah dibatalkan.' });
            router.push('/portal/purchasing');
            router.refresh();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal membatalkan pengajuan.' });
        }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Riwayat Pengajuan Barang</CardTitle>
              <CardDescription>Proyek: {site.name}</CardDescription>
            </div>
            <Button onClick={() => setIsNewRequestDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Buat Pengajuan Baru
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Total Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialRequests.length > 0 ? (
                initialRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{format(new Date(req.requestDate), 'PPP')}</TableCell>
                    <TableCell>{formatCurrency(req.totalActualPrice)}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(req)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        {req.status === 'Pending' && (
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isPending} className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Batalkan Pengajuan?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                      Aksi ini tidak dapat dibatalkan. Pengajuan Anda akan dihapus.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Tidak</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(req.id)}>
                                          Ya, Batalkan
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                        )}
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
        </CardContent>
      </Card>
      
      <Dialog open={isNewRequestDialogOpen} onOpenChange={setIsNewRequestDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Formulir Pengajuan Barang Baru</DialogTitle>
            <DialogDescription>Isi daftar barang yang dibutuhkan untuk proyek {site.name}.</DialogDescription>
          </DialogHeader>
          <NewRequestForm />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        {selectedRequest && (
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detail Pengajuan #{selectedRequest.id.substring(0, 6)}</DialogTitle>
                    <DialogDescription>
                        Status: <Badge variant={getStatusVariant(selectedRequest.status)}>{selectedRequest.status}</Badge>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div>
                        <h4 className="font-semibold mb-2">Item</h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Barang</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead className="text-right">Harga</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedRequest.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.quantity} {item.unit}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.actualPrice)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="font-bold">
                                    <TableCell colSpan={2}>Total</TableCell>
                                    <TableCell className="text-right">{formatCurrency(selectedRequest.totalActualPrice)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Histori Proses</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between"><span>Dibuat:</span> <span>{format(new Date(selectedRequest.requestDate), 'PPP')}</span></li>
                            <li className="flex justify-between"><span>Diverifikasi Purchasing:</span> <span>{selectedRequest.verifiedDate ? format(new Date(selectedRequest.verifiedDate), 'PPP') : '-'}</span></li>
                            <li className="flex justify-between"><span>Disetujui Finance:</span> <span>{selectedRequest.approvedDate ? format(new Date(selectedRequest.approvedDate), 'PPP') : '-'}</span></li>
                             <li className="flex justify-between"><span>Siap Diambil/Kirim:</span> <span>{selectedRequest.readyDate ? format(new Date(selectedRequest.readyDate), 'PPP') : '-'}</span></li>
                        </ul>
                    </div>

                    {selectedRequest.purchasingNotes && (
                        <div>
                            <h4 className="font-semibold">Catatan Purchasing</h4>
                            <p className="text-sm text-muted-foreground p-2 border rounded-md">{selectedRequest.purchasingNotes}</p>
                        </div>
                    )}
                    {selectedRequest.financeNotes && (
                        <div>
                            <h4 className="font-semibold">Catatan Finance</h4>
                            <p className="text-sm text-muted-foreground p-2 border rounded-md">{selectedRequest.financeNotes}</p>
                        </div>
                    )}
                    {selectedRequest.rejectionReason && (
                         <div>
                            <h4 className="font-semibold text-destructive">Alasan Penolakan</h4>
                            <p className="text-sm text-destructive p-2 border border-destructive/50 bg-destructive/10 rounded-md">{selectedRequest.rejectionReason}</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        )}
      </Dialog>
    </>
  );
}
