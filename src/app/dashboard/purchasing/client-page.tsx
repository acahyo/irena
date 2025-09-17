'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Trash2, SquarePen, Eye, Loader2, CheckCircle, XCircle, Bot, CircleDollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseRequest, PurchaseRequestItem, Site } from '@/lib/types';
import { deletePurchaseRequest, updatePurchaseRequest } from '@/actions/purchasing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
    case 'Verified by Purchasing': return 'default';
    case 'Processing': return 'default';
    case 'Approved by Finance': return 'default';
    case 'Completed': return 'default';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};


export default function PurchasingClientPage({
  initialRequests,
  sites,
  userRole,
}: {
  initialRequests: PurchaseRequest[];
  sites: Site[];
  userRole: string;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [editedItems, setEditedItems] = useState<PurchaseRequestItem[]>([]);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
        (projectFilter === 'all' || req.projectId === projectFilter) &&
        (statusFilter === 'all' || req.status === statusFilter)
    );
  }, [requests, projectFilter, statusFilter]);

  const handleOpenModal = (req: PurchaseRequest) => {
    setSelectedRequest(req);
    setEditedItems(JSON.parse(JSON.stringify(req.items))); // Deep copy
    if (userRole === 'Purchasing') {
        setNotes(req.purchasingNotes || '');
    } else if (userRole === 'Finance') {
        setNotes(req.financeNotes || '');
    }
    setRejectionReason(req.rejectionReason || '');
    setIsModalOpen(true);
  };
  
  const handleItemChange = (index: number, field: keyof PurchaseRequestItem, value: string) => {
    const newItems = [...editedItems];
    (newItems[index] as any)[field] = value === '' ? undefined : Number(value);
    setEditedItems(newItems);
  };
  
  const handleStatusUpdate = (status: PurchaseRequest['status']) => {
    if (!selectedRequest) return;
    
    startTransition(async () => {
        try {
            const updates: Partial<PurchaseRequest> = { status };
            if (userRole === 'Purchasing') {
                updates.items = editedItems;
                updates.purchasingNotes = notes;
            }
            if (userRole === 'Finance') {
                updates.financeNotes = notes;
            }
            if (status === 'Rejected') {
                updates.rejectionReason = rejectionReason;
            }
            await updatePurchaseRequest(selectedRequest.id, updates);
            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, ...updates } : r));
            toast({ title: 'Sukses!', description: `Status pengajuan telah diperbarui menjadi "${status}".`});
            setIsModalOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status.' });
        }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deletePurchaseRequest(id);
        setRequests(prev => prev.filter(r => r.id !== id));
        toast({ title: 'Sukses!', description: 'Pengajuan telah dihapus.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus pengajuan.' });
      }
    });
  };
  
  const totalActualPrice = useMemo(() => {
    if (!editedItems) return 0;
    return editedItems.reduce((sum, item) => sum + ((item.actualPrice || 0) * item.quantity), 0);
  }, [editedItems]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manajemen Purchasing</CardTitle>
              <CardDescription>Verifikasi dan setujui pengajuan barang dari berbagai proyek.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Proyek" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Proyek</SelectItem>
                  {sites.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Verified by Purchasing">Verified by Purchasing</SelectItem>
                  <SelectItem value="Approved by Finance">Approved by Finance</SelectItem>
                   <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Proyek</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Total Estimasi</TableHead>
                <TableHead>Total Aktual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{format(new Date(req.requestDate), 'PPP')}</TableCell>
                    <TableCell>{req.projectName}</TableCell>
                    <TableCell>{req.requesterName}</TableCell>
                    <TableCell>{formatCurrency(req.totalEstimatedPrice)}</TableCell>
                    <TableCell>{formatCurrency(req.totalActualPrice)}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenModal(req)}>
                           <Eye className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Tidak ada pengajuan ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedRequest && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Detail Pengajuan #{selectedRequest.id.substring(0, 6)}</DialogTitle>
                    <DialogDescription>
                        Proyek: {selectedRequest.projectName} | Pemohon: {selectedRequest.requesterName}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-4">
                    <div>
                        <h4 className="font-semibold mb-2">Item yang Diajukan</h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Barang</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Estimasi</TableHead>
                                    <TableHead>Aktual</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {editedItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.quantity} {item.unit}</TableCell>
                                        <TableCell>{formatCurrency(item.estimatedPrice)}</TableCell>
                                        <TableCell>
                                             {userRole === 'Purchasing' && selectedRequest.status === 'Pending' ? (
                                                <Input 
                                                    type="number" 
                                                    value={item.actualPrice || ''}
                                                    onChange={(e) => handleItemChange(index, 'actualPrice', e.target.value)}
                                                    className="h-8"
                                                />
                                             ) : formatCurrency(item.actualPrice)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <div className="font-bold mt-2 text-right">
                            Total Aktual: {formatCurrency(totalActualPrice)}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Catatan & Status</h4>
                        {selectedRequest.purchasingNotes && (
                            <div className="mb-4">
                                <Label className="text-xs text-muted-foreground">Catatan Purchasing</Label>
                                <p className="text-sm border p-2 rounded-md bg-muted/50">{selectedRequest.purchasingNotes}</p>
                            </div>
                        )}
                        {selectedRequest.financeNotes && (
                            <div className="mb-4">
                                <Label className="text-xs text-muted-foreground">Catatan Finance</Label>
                                <p className="text-sm border p-2 rounded-md bg-muted/50">{selectedRequest.financeNotes}</p>
                            </div>
                        )}
                         {selectedRequest.rejectionReason && (
                            <div className="mb-4">
                                <Label className="text-xs text-destructive">Alasan Penolakan</Label>
                                <p className="text-sm border p-2 rounded-md border-destructive/50 bg-destructive/10">{selectedRequest.rejectionReason}</p>
                            </div>
                        )}
                        {(userRole === 'Purchasing' || userRole === 'Finance') && (
                            <div className="space-y-2 mb-4">
                                <Label htmlFor="notes">Catatan Anda</Label>
                                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>
                        )}
                        {selectedRequest.status === 'Rejected' && (
                             <div className="space-y-2 mb-4">
                                <Label htmlFor="rejectionReason">Alasan Penolakan</Label>
                                <Textarea id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose>
                     {userRole === 'Purchasing' && selectedRequest.status === 'Pending' && (
                        <>
                         <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <XCircle />} Tolak
                         </Button>
                         <Button onClick={() => handleStatusUpdate('Verified by Purchasing')} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle />} Verifikasi
                         </Button>
                        </>
                    )}
                    {userRole === 'Finance' && selectedRequest.status === 'Verified by Purchasing' && (
                        <>
                         <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isPending}>
                           {isPending ? <Loader2 className="animate-spin" /> : <XCircle />} Tolak
                         </Button>
                         <Button onClick={() => handleStatusUpdate('Approved by Finance')} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <CircleDollarSign />} Setujui Dana
                         </Button>
                        </>
                    )}
                     {userRole === 'Purchasing' && selectedRequest.status === 'Approved by Finance' && (
                        <Button onClick={() => handleStatusUpdate('Processing')} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <Bot />} Proses Pembelian
                        </Button>
                    )}
                     {userRole === 'Purchasing' && selectedRequest.status === 'Processing' && (
                        <Button onClick={() => handleStatusUpdate('Completed')} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle />} Selesai
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
