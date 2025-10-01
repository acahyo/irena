
'use client';

import { useState, useTransition } from 'react';
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
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle, Trash2, Pencil, Loader2, Truck, Wrench, ClipboardCheck, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Vehicle, P2hReport, UnitConditionReport } from '@/lib/types';
import { createVehicle, updateVehicle, deleteVehicle } from '@/actions/vehicles';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export default function VehiclesClientPage({
  initialVehicles,
  initialP2hReports,
  initialConditionReports
}: {
  initialVehicles: Vehicle[],
  initialP2hReports: P2hReport[],
  initialConditionReports: UnitConditionReport[]
}) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  const handleOpenDialog = (vehicle: Vehicle | null = null) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const vehicleData = {
        fleetNumber: data.fleetNumber as string,
        category: data.category as 'LV' | 'BUS',
    };
    
    startTransition(async () => {
        try {
            if (editingVehicle?.id) {
                await updateVehicle(editingVehicle.id, vehicleData);
                toast({ title: 'Sukses!', description: 'Kendaraan berhasil diperbarui.' });
            } else {
                await createVehicle(vehicleData);
                toast({ title: 'Sukses!', description: 'Kendaraan baru berhasil ditambahkan.' });
            }
            setIsDialogOpen(false);
            router.refresh(); // Refresh server-side props
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan kendaraan.' });
        }
    });
  }
  
  const handleDelete = (id: string) => {
      startTransition(async () => {
          try {
              await deleteVehicle(id);
              setVehicles(prev => prev.filter(v => v.id !== id));
              toast({ title: 'Sukses!', description: 'Kendaraan telah dihapus.' });
          } catch(error) {
              toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus kendaraan.' });
          }
      });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kendaraan Operasional</CardTitle>
              <CardDescription>Kelola daftar kendaraan operasional untuk office.</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Tambah Kendaraan</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Lambung</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.fleetNumber}</TableCell>
                  <TableCell>{vehicle.category}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(vehicle)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Anda yakin?</AlertDialogTitle><AlertDialogDescription>Aksi ini akan menghapus data kendaraan secara permanen.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(vehicle.id)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {vehicles.length === 0 && (
                <TableRow><TableCell colSpan={3} className="h-24 text-center">Belum ada kendaraan yang ditambahkan.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardCheck /> Laporan P2H Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-72">
                <div className="space-y-4">
                    {initialP2hReports.length > 0 ? (
                        initialP2hReports.slice(0, 5).map(report => (
                             <div key={report.id} className="p-3 border rounded-md text-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{report.driverName}</p>
                                        <p className="text-xs text-muted-foreground">{report.unitId} - {format(new Date(report.timestamp as any), 'dd MMM yyyy, HH:mm')}</p>
                                    </div>
                                    <a href={report.photoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Lihat Foto</a>
                                </div>
                                {report.notes && <p className="mt-2 text-xs italic">"{report.notes}"</p>}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-10">Tidak ada laporan P2H.</p>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wrench /> Laporan Kondisi Unit Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
             <ScrollArea className="h-72">
                <div className="space-y-4">
                     {initialConditionReports.length > 0 ? (
                        initialConditionReports.slice(0, 5).map(report => (
                             <div key={report.id} className="p-3 border rounded-md text-sm">
                                <p className="font-semibold">{report.driverName}</p>
                                <p className="text-xs text-muted-foreground">{report.unitId} - {format(new Date(report.timestamp as any), 'dd MMM yyyy, HH:mm')}</p>
                                <p className="mt-2 text-xs italic">"{report.notes}"</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-10">Tidak ada laporan kondisi unit.</p>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingVehicle?.id ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}</DialogTitle>
                <DialogDescription>Isi detail kendaraan operasional di bawah ini.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="fleetNumber">Nomor Lambung</Label>
                    <Input id="fleetNumber" name="fleetNumber" defaultValue={editingVehicle?.fleetNumber} required placeholder="e.g., LV-001"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Kategori Kendaraan</Label>
                    <Select name="category" defaultValue={editingVehicle?.category || 'LV'} required>
                        <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LV">LV (Light Vehicle)</SelectItem>
                            <SelectItem value="BUS">BUS</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
