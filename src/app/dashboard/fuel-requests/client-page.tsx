
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
import type { FuelRequest, Vehicle, User } from '@/lib/types';
import { updateFuelRequest } from '@/actions/fuel';
import { useUser } from '@/contexts/user-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Loader2, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
        (vehicleFilter === 'all' || req.vehicleId === vehicleFilter)
    );
  }, [requests, vehicleFilter]);

  const handleOpenModal = (request: FuelRequest) => {
    setSelectedRequest(request);
    setApprovedAmount(request.amount.toString()); // Default to requested amount
    setRejectionReason('');
    setIsModalOpen(true);
  };

  const handleStatusUpdate = (status: 'Approved' | 'Rejected') => {
    if (!selectedRequest || !user) return;

    if (status === 'Approved' && (!approvedAmount || Number(approvedAmount) <= 0)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Nominal persetujuan harus diisi.' });
        return;
    }

    startTransition(async () => {
      const updates: Partial<FuelRequest> = { 
        status,
        approvedById: user.id,
        approvedByName: user.name,
        approvedDate: new Date(),
      };
      if (status === 'Approved') {
        updates.approvedAmount = Number(approvedAmount);
      }
      if (status === 'Rejected') {
        updates.rejectionReason = rejectionReason;
      }

      const result = await updateFuelRequest(selectedRequest.id, updates);
      if (result.success) {
        toast({ title: 'Sukses!', description: result.message });
        setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, ...updates } : r));
        setIsModalOpen(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

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
                <TableHead>Odometer</TableHead>
                <TableHead>Diajukan</TableHead>
                <TableHead>Disetujui</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>{format(new Date(req.requestDate), 'dd MMM yyyy, HH:mm')}</TableCell>
                  <TableCell>{req.driverName}</TableCell>
                  <TableCell>{req.vehicleId}</TableCell>
                  <TableCell>{req.odometer.toLocaleString('id-ID')} KM</TableCell>
                  <TableCell>{formatCurrency(req.amount)}</TableCell>
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Detail Pengajuan BBM</DialogTitle>
                    <DialogDescription>
                        Oleh {selectedRequest.driverName} pada {format(new Date(selectedRequest.requestDate), 'dd MMM yyyy, HH:mm')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div><Label>Kendaraan</Label><p>{selectedRequest.vehicleId}</p></div>
                       <div><Label>Odometer</Label><p>{selectedRequest.odometer.toLocaleString('id-ID')} KM</p></div>
                       <div><Label>Jumlah Diajukan</Label><p className="font-bold">{formatCurrency(selectedRequest.amount)}</p></div>
                    </div>
                    {selectedRequest.status !== 'Pending' && (
                        <div>
                            <Label>Jumlah Disetujui</Label>
                            <p className="font-bold text-lg">{formatCurrency(selectedRequest.approvedAmount)}</p>
                        </div>
                    )}
                    {(user?.role === 'Purchasing' || user?.role === 'Administrator') && selectedRequest.status === 'Pending' && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="approvedAmount">Nominal Persetujuan (Rp)</Label>
                                <Input id="approvedAmount" type="number" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)} />
                            </div>
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
                           <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isPending}>
                             {isPending ? <Loader2 className="animate-spin" /> : <X />} Tolak
                           </Button>
                           <Button onClick={() => handleStatusUpdate('Approved')} disabled={isPending}>
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
