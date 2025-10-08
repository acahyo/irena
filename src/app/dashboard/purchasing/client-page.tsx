

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
import { Eye, Loader2, CheckCircle, XCircle, CircleDollarSign, Download, Trash2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseRequest, Site, User } from '@/lib/types';
import { updatePurchaseRequest, deletePurchaseRequest, forwardToFinance } from '@/actions/purchasing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import { useUser } from '@/contexts/user-context';


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


export default function PurchasingClientPage({
  initialRequests,
  sites,
}: {
  initialRequests: PurchaseRequest[];
  sites: Site[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const user = useUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [proposedAmount, setProposedAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
        (projectFilter === 'all' || req.projectId === projectFilter) &&
        (statusFilter === 'all' || req.status === statusFilter)
    );
  }, [requests, projectFilter, statusFilter]);

  const handleOpenModal = (req: PurchaseRequest) => {
    if (!user) return;
    setSelectedRequest(req);
    setProposedAmount(req.proposedAmount?.toString() || '');
    setRejectionReason(req.rejectionReason || '');
    setIsModalOpen(true);
  };
  
  const handleApproveAvailable = () => {
      if (!selectedRequest || !user) return;
      startTransition(async () => {
          try {
              await updatePurchaseRequest(selectedRequest.id, { status: 'Approved by Purchasing', verifiedDate: new Date() });
              toast({ title: 'Sukses!', description: 'Pengajuan telah disetujui (barang tersedia).' });
              setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {...r, status: 'Approved by Purchasing'} : r));
              setIsModalOpen(false);
          } catch(error) {
               toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status.' });
          }
      });
  }
  
  const handleForwardToFinance = () => {
       if (!selectedRequest || !user) return;
       if (!proposedAmount || Number(proposedAmount) <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Mohon masukkan nominal dana yang akan diajukan ke Finance.' });
            return;
       }
       startTransition(async () => {
           const result = await forwardToFinance(selectedRequest, Number(proposedAmount), user.id, user.name);
           if (result.success) {
               toast({ title: 'Sukses!', description: result.message });
               setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {...r, status: 'Forwarded to Finance', proposedAmount: Number(proposedAmount)} : r));
               setIsModalOpen(false);
           } else {
               toast({ variant: 'destructive', title: 'Error', description: result.message });
           }
       });
  }

  const handleReject = () => {
    if (!selectedRequest || !user) return;
    startTransition(async () => {
        try {
            await updatePurchaseRequest(selectedRequest.id, { status: 'Rejected', rejectionReason });
            toast({ title: 'Sukses!', description: 'Pengajuan telah ditolak.' });
            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {...r, status: 'Rejected', rejectionReason} : r));
            setIsModalOpen(false);
        } catch(error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status.' });
        }
    });
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
        try {
            await deletePurchaseRequest(id);
            setRequests(prev => prev.filter(r => r.id !== id));
            setIsModalOpen(false);
            toast({ title: 'Sukses!', description: 'Pengajuan telah dihapus.' });
        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus pengajuan.' });
        }
    });
  };

  const handleFinalApprove = () => {
    if (!selectedRequest || !user) return;
    startTransition(async () => {
        try {
            await updatePurchaseRequest(selectedRequest.id, { status: 'Approved' });
            toast({ title: 'Sukses!', description: 'Pengajuan barang telah ditandai selesai.' });
            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {...r, status: 'Approved'} : r));
            setIsModalOpen(false);
        } catch(error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status.' });
        }
    });
  };

  const handleExport = () => {
    const dataToExport = filteredRequests.map(req => ({
      'ID Pengajuan': req.id,
      'Tanggal': format(new Date(req.requestDate), 'yyyy-MM-dd'),
      'Proyek': req.projectName,
      'Pemohon': req.requesterName,
      'Status': req.status,
      'Nominal Diajukan': req.proposedAmount,
      'Barang': req.items.map(item => `${item.name} (${item.quantity})`).join(', '),
      'Alasan Penolakan': req.rejectionReason,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengajuan Barang');
    
    // Set column widths
    worksheet['!cols'] = [
        { wch: 22 }, // ID
        { wch: 12 }, // Tanggal
        { wch: 25 }, // Proyek
        { wch: 20 }, // Pemohon
        { wch: 25 }, // Status
        { wch: 20 }, // Nominal
        { wch: 50 }, // Barang
        { wch: 30 }, // Alasan Penolakan
    ];

    XLSX.writeFile(workbook, `pengajuan_barang_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast({
      title: 'Ekspor Berhasil!',
      description: 'Data pengajuan barang telah diekspor ke file Excel.',
    });
  };

  if (!user) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <>
    <div className="space-y-6">
        <Card>
            <CardHeader>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                <CardTitle>Manajemen Pengajuan Barang</CardTitle>
                <CardDescription>Verifikasi dan proses pengajuan barang dari berbagai proyek.</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter Proyek" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">Semua Proyek</SelectItem>
                    {sites.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved by Purchasing">Approved (Stok Ada)</SelectItem>
                        <SelectItem value="Forwarded to Finance">Diteruskan ke Finance</SelectItem>
                        <SelectItem value="Approved">Approved (Finance)</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Ekspor Excel
                </Button>
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
                    <TableHead>Nominal</TableHead>
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
                        <TableCell>{formatCurrency(req.proposedAmount)}</TableCell>
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
                    <TableCell colSpan={6} className="h-24 text-center">
                        Tidak ada pengajuan ditemukan.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      </div>

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
                     <div>
                        <h4 className="font-semibold mb-2">Verifikasi & Aksi</h4>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="proposedAmount">Nominal Dana Pengajuan (Rp)</Label>
                                <Input id="proposedAmount" type="number" value={proposedAmount} onChange={(e) => setProposedAmount(e.target.value)} placeholder="e.g. 5000000" disabled={selectedRequest.status !== 'Pending' || isPending} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rejectionReason">Alasan Penolakan (jika ditolak)</Label>
                                <Textarea id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} disabled={selectedRequest.status !== 'Pending' || isPending}/>
                            </div>
                        </div>
                        
                        {selectedRequest.status !== 'Pending' && (
                            <div className="mt-4">
                                <p className="text-sm text-muted-foreground">Status saat ini: <Badge variant={getStatusVariant(selectedRequest.status)}>{selectedRequest.status}</Badge></p>
                                {selectedRequest.rejectionReason && (
                                     <div className="mt-4">
                                        <Label className="text-xs text-destructive">Alasan Penolakan</Label>
                                        <p className="text-sm border p-2 rounded-md border-destructive/50 bg-destructive/10">{selectedRequest.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" className="mr-auto" disabled={user.role !== 'Purchasing' || isPending}>
                                {isPending ? <Loader2 className="animate-spin"/> : <Trash2/>} Hapus
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Yakin ingin menghapus?</AlertDialogTitle>
                                <AlertDialogDescription>Tindakan ini tidak dapat diurungkan.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(selectedRequest.id)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Tutup</Button>
                    
                    {user.role === 'Purchasing' && selectedRequest.status === 'Pending' && (
                        <>
                         <Button variant="outline" onClick={handleReject} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <XCircle />} Tolak
                         </Button>
                         <Button onClick={handleForwardToFinance} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <Send />} Ajukan ke Finance
                         </Button>
                          <Button onClick={handleApproveAvailable} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle />} Setujui (Stok Ada)
                         </Button>
                        </>
                    )}
                    {user.role === 'Purchasing' && selectedRequest.status === 'Forwarded to Finance' && (
                         <Button onClick={handleFinalApprove} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle />} Tandai Selesai (Approved)
                         </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
