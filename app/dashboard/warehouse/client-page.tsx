
'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Pencil, Loader2, Archive, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WarehouseItem, PurchaseRequest } from '@/lib/types';
import { createWarehouseItem, updateWarehouseItem, deleteWarehouseItem } from '@/actions/warehouse';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

export default function WarehouseClientPage({ 
  initialItems,
  stockOutRequests
}: { 
  initialItems: WarehouseItem[],
  stockOutRequests: PurchaseRequest[] 
}) {
  const [items, setItems] = useState(initialItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<WarehouseItem> | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const allCategories = new Set(items.map(item => item.category));
    return ['all', ...Array.from(allCategories).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (categoryFilter === 'all') return items;
    return items.filter(item => item.category === categoryFilter);
  }, [items, categoryFilter]);

  const { totalStockValue, stockOutSummary, totalStockOutValue } = useMemo(() => {
    const totalStock = initialItems.reduce((sum, item) => sum + (item.stock * (item.price || 0)), 0);

    const stockOut = stockOutRequests.flatMap(req => req.items);
    const totalOut = stockOut.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);
    
    const summary = stockOut.reduce((acc, item) => {
        if (!acc[item.name]) {
            acc[item.name] = { name: item.name, quantity: 0, totalValue: 0 };
        }
        acc[item.name].quantity += item.quantity;
        acc[item.name].totalValue += item.quantity * (item.price || 0);
        return acc;
    }, {} as Record<string, { name: string, quantity: number, totalValue: number }>);
    
    return {
        totalStockValue: totalStock,
        stockOutSummary: Object.values(summary).sort((a,b) => b.totalValue - a.totalValue),
        totalStockOutValue: totalOut
    }
  }, [initialItems, stockOutRequests]);
  
  const handleOpenDialog = (item: Partial<WarehouseItem> | null = null) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const itemData: any = {
      name: data.name,
      category: data.category,
      stock: Number(data.stock),
      unit: data.unit,
      location: data.location,
      price: Number(data.price),
    };
    
    startTransition(async () => {
      try {
        if (editingItem?.id) {
          await updateWarehouseItem(editingItem.id, itemData);
          toast({ title: 'Sukses!', description: 'Barang berhasil diperbarui.' });
        } else {
          await createWarehouseItem(itemData);
          toast({ title: 'Sukses!', description: 'Barang baru berhasil ditambahkan.' });
        }
        setIsDialogOpen(false);
        router.refresh();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan barang.' });
      }
    });
  }
  
  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteWarehouseItem(id);
        toast({ title: 'Sukses!', description: 'Barang telah dihapus.' });
        router.refresh();
      } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus barang.' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowUp className="text-green-500" /> Nilai Stok Gudang</CardTitle>
            <CardDescription className="text-2xl font-bold">{formatCurrency(totalStockValue)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <Table>
                <TableHeader><TableRow><TableHead>Nama Barang</TableHead><TableHead className="text-right">Total Nilai</TableHead></TableRow></TableHeader>
                <TableBody>
                  {initialItems.filter(item => item.stock > 0).map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name} <span className="text-muted-foreground">({item.stock} {item.unit})</span></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.stock * (item.price || 0))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowDown className="text-red-500" /> Rekap Barang Keluar</CardTitle>
            <CardDescription className="text-2xl font-bold">{formatCurrency(totalStockOutValue)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <Table>
                <TableHeader><TableRow><TableHead>Nama Barang</TableHead><TableHead className="text-right">Total Nilai</TableHead></TableRow></TableHeader>
                <TableBody>
                  {stockOutSummary.map(item => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name} <span className="text-muted-foreground">({item.quantity})</span></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Archive /> Daftar Barang Gudang</CardTitle>
              <CardDescription>Kelola inventaris barang yang tersedia di gudang.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        {categories.map(cat => cat !== 'all' && <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Tambah Barang</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Harga Satuan</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                  <TableCell className="font-semibold">{item.stock}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>{item.location || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Anda yakin?</AlertDialogTitle><AlertDialogDescription>Aksi ini akan menghapus barang secara permanen.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center">Belum ada barang di kategori ini.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
            <DialogDescription>Isi detail barang gudang di bawah ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nama Barang</Label>
                    <Input id="name" name="name" defaultValue={editingItem?.name} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Input id="category" name="category" defaultValue={editingItem?.category} required placeholder="e.g., ATK, Sparepart"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stock">Jumlah Stok</Label>
                    <Input id="stock" name="stock" type="number" defaultValue={editingItem?.stock} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unit">Satuan</Label>
                    <Input id="unit" name="unit" defaultValue={editingItem?.unit} required placeholder="e.g., pcs, liter, kg, box"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price">Harga Satuan (Rp)</Label>
                    <Input id="price" name="price" type="number" defaultValue={editingItem?.price || ''} placeholder="e.g., 50000"/>
                </div>
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="location">Lokasi (Opsional)</Label>
                    <Input id="location" name="location" defaultValue={editingItem?.location || ''} placeholder="e.g., Rak A1"/>
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
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
