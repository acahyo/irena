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
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, PlusCircle, Trash2, Pencil, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { KoperasiItem } from '@/lib/types';
import { createKoperasiItem, updateKoperasiItem, deleteKoperasiItem } from '@/actions/koperasi';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};


export default function KoperasiItemsClientPage({ initialItems }: { initialItems: KoperasiItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<KoperasiItem> | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  const handleOpenDialog = (item: Partial<KoperasiItem> | null = null) => {
    setEditingItem(item);
    setImagePreview(item?.imageUrl || null);
    setIsDialogOpen(true);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        }
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const itemData: any = {
        name: data.name,
        price: Number(data.price),
        stock: Number(data.stock),
        imageUrl: imagePreview || '',
    };
    
    startTransition(async () => {
        try {
            if (editingItem?.id) {
                await updateKoperasiItem(editingItem.id, itemData);
                toast({ title: 'Sukses!', description: 'Barang berhasil diperbarui.' });
            } else {
                await createKoperasiItem(itemData);
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
              await deleteKoperasiItem(id);
              setItems(prev => prev.filter(item => item.id !== id));
              toast({ title: 'Sukses!', description: 'Barang telah dihapus.' });
          } catch(error) {
              toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus barang.' });
          }
      });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kelola Barang Koperasi</CardTitle>
              <CardDescription>Tambah, edit, atau hapus barang yang tersedia di koperasi.</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Tambah Barang</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barang</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-md">
                            <AvatarImage src={item.imageUrl} alt={item.name} />
                            <AvatarFallback className="rounded-md">{item.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>{item.stock}</TableCell>
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
              {items.length === 0 && (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Belum ada barang ditambahkan.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingItem?.id ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
                <DialogDescription>Isi detail barang di bawah ini.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama Barang</Label>
                    <Input id="name" name="name" defaultValue={editingItem?.name} required />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="price">Harga</Label>
                        <Input id="price" name="price" type="number" defaultValue={editingItem?.price} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stock">Stok</Label>
                        <Input id="stock" name="stock" type="number" defaultValue={editingItem?.stock} required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Gambar Barang</Label>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-24 w-24 rounded-md">
                            <AvatarImage src={imagePreview || undefined} className="object-contain" />
                            <AvatarFallback className="rounded-md"><Upload /></AvatarFallback>
                        </Avatar>
                        <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-sm" />
                    </div>
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
    </>
  );
}
