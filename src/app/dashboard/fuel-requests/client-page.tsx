
'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
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
import type { FuelRequest, Vehicle, User } from '@/lib/types';
import { processFuelRequest, updateFuelRequestStatus } from '@/actions/fuel';
import { useUser } from '@/contexts/user-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Loader2, Check, X, Send, Package, ExternalLink } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

const formatCurrency = (amount?: number) => {
  if (amount === undefined) return 'N/A';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'Approved by Purchasing': return 'outline';
    case 'Forwarded to Finance': return 'outline';
    case 'Approved': return 'default';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};

export default function FuelRequestsClientPage({ initialRequests, vehicles }: { initialRequests: FuelRequest[], vehicles: Vehicle[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FuelRequest | null>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const user = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
        (vehicleFilter === 'all' || req.vehicleId === vehicleFilter)
    );
  }, [requests, vehicleFilter]);

  const handleOpenModal = (request: FuelRequest) => {
    setSelectedRequest(request);
    setApprovedAmount(request.approvedAmount?.toString() || '');
    setRejectionReason(request.rejectionReason || '');
    setIsModalOpen(true);
  };
  
  const handleProcessRequest = () => {
    if (!selectedRequest || !user) return;
    
    startTransition(async () => {
      const updates = {
        approvedById: user.id,
        approvedByName: user.name,
        approvedDate: new Date(),
        rejectionReason: rejectionReason,
        approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
      };

      const result = await processFuelRequest(selectedRequest, updates);

      if (result.success) {
        toast({ title: 'Sukses!', description: result.message });
        setIsModalOpen(false);
        // This is tricky because the status can change in multiple ways.
        // A full refresh is safer.
        location.reload();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  }
  
   const handleFinanceStatusUpdate = (status: 'Approved' | 'Rejected') => {
      if(!selectedRequest || !user) return;

      startTransition(async () => {
          const updates: Partial<FuelRequest> = { 
            status,
            approvedById: user.id,
            approvedByName: user.name,
            approvedDate: new Date(),
          };
          if (status === 'Rejected') {
            updates.rejectionReason = rejectionReason;
          }

          const result = await updateFuelRequestStatus(selectedRequest.id, updates);
          if (result.success) {
              toast({ title: 'Sukses!', description: `Status pengajuan berhasil diubah menjadi ${status}` });
              setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {...r, status} : r));
              setIsModalOpen(false);
          } else {
              toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui status.' });
          }
      });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Pengajuan BBM Driver</CardTitle>
              <CardDescription>Verifikasi dan setujui pengajuan bahan bakar dari driver.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                 <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter Kendaraan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kendaraan</SelectItem>
                        {vehicles.map(v => <SelectItem key={v.id} value={v.fleetNumber}>{v.fleetNumber}</SelectItem>)}
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
                <TableHead>Driver</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Jenis & Jumlah</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>Diajukan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>{isClient ? format(new Date(req.requestDate), 'dd MMM yyyy, HH:mm') : 'Loading...'}</TableCell>
                  <TableCell>{req.driverName}</TableCell>
                  <TableCell>{req.vehicleId}</TableCell>
                  <TableCell>{req.fuelType} ({req.liters} L)</TableCell>
                  <TableCell>{req.odometer.toLocaleString('id-ID')} KM</TableCell>
                  <TableCell>{formatCurrency(req.approvedAmount)}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(req)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
               {filteredRequests.length === 0 && (
                <TableRow><TableCell colSpan={8} className="h-24 text-center">Tidak ada pengajuan BBM ditemukan.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selectedRequest && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Detail Pengajuan BBM</DialogTitle>
                    <DialogDescription>
                        Oleh {selectedRequest.driverName} pada {isClient ? format(new Date(selectedRequest.requestDate), 'dd MMM yyyy, HH:mm') : 'Loading...'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div><Label>Kendaraan</Label><p>{selectedRequest.vehicleId}</p></div>
                       <div><Label>Odometer</Label><p>{selectedRequest.odometer.toLocaleString('id-ID')} KM</p></div>
                       <div><Label>Jenis BBM</Label><p className="font-bold">{selectedRequest.fuelType}</p></div>
                       <div><Label>Jumlah Diajukan</Label><p className="font-bold">{selectedRequest.liters} Liter</p></div>
                       <div className="col-span-2">
                           <Label>Foto Odometer</Label>
                           {selectedRequest.odometerPhotoUrl ? (
                            <Link href={selectedRequest.odometerPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                                Lihat Foto <ExternalLink className="h-3 w-3" />
                           </Link>
                           ) : <p className="text-sm text-muted-foreground">Tidak ada foto.</p>
                           }
                        </div>
                    </div>
                    {selectedRequest.isFromStock && <Badge>Diproses dari stok gudang</Badge>}

                    {(user?.role === 'Purchasing' || user?.role === 'Administrator') && selectedRequest.status === 'Pending' && selectedRequest.fuelType !== 'Solar' && (
                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="approvedAmount">Nominal Dana (Rp)</Label>
                            <Input id="approvedAmount" type="number" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)} placeholder="Jumlah yang akan diajukan ke Finance" />
                        </div>
                    )}
                    
                    {(user?.role === 'Finance' || user?.role === 'Administrator') && selectedRequest.status === 'Forwarded to Finance' && (
                         <div className="space-y-4 pt-4 border-t">
                            <div><Label>Nominal Diajukan Purchasing</Label><p className="font-bold text-lg">{formatCurrency(selectedRequest.approvedAmount)}</p></div>
                            <div className="space-y-2">
                                <Label htmlFor="rejectionReason">Alasan Penolakan (jika ditolak)</Label>
                                <Textarea id="rejectionReason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Tutup</Button>
                    {(user?.role === 'Purchasing' || user?.role === 'Administrator') && selectedRequest.status === 'Pending' && (
                       <>
                        {selectedRequest.fuelType === 'Solar' ? (
                          <Button onClick={handleProcessRequest} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin mr-2" /> : <Package className="mr-2 h-4 w-4" />} Proses Pengajuan Solar
                          </Button>
                        ) : (
                          <Button onClick={handleProcessRequest} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />} Ajukan ke Finance
                          </Button>
                        )}
                       </>
                    )}
                     {(user?.role === 'Finance' || user?.role === 'Administrator') && selectedRequest.status === 'Forwarded to Finance' && (
                        <>
                           <Button variant="destructive" onClick={() => handleFinanceStatusUpdate('Rejected')} disabled={isPending}>
                             {isPending ? <Loader2 className="animate-spin" /> : <X />} Tolak
                           </Button>
                           <Button onClick={() => handleFinanceStatusUpdate('Approved')} disabled={isPending}>
                             {isPending ? <Loader2 className="animate-spin" /> : <Check />} Setujui
                           </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    