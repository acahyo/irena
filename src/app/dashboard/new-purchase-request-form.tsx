'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseRequestItem, User, Site } from '@/lib/types';
import { createPurchaseRequest } from '@/actions/purchasing';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';

export default function NewPurchaseRequestForm({ user, site }: { user: User; site: Site }) {
  const [items, setItems] = useState<Partial<Omit<PurchaseRequestItem, 'estimatedPrice'>>>([{ name: '', quantity: 1, unit: '' }]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleItemChange = (index: number, field: keyof Omit<PurchaseRequestItem, 'estimatedPrice'>, value: string) => {
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
          requesterId: user.id,
          requesterName: user.name,
          projectId: site.id,
          projectName: site.name,
          items: validItems.map(item => ({ ...item, estimatedPrice: 0 })) as PurchaseRequestItem[],
        };
        await createPurchaseRequest(requestData);
        toast({ title: 'Sukses!', description: 'Pengajuan barang berhasil dikirim.' });
        setItems([{ name: '', quantity: 1, unit: '' }]); // Reset form
        router.refresh(); // Refresh dashboard to show new request
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengirim pengajuan.' });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Pengajuan Kebutuhan</CardTitle>
        <CardDescription>Isi daftar barang yang dibutuhkan untuk proyek.</CardDescription>
      </CardHeader>
      <CardContent>
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
                <div className="col-span-2 space-y-1">
                  <Label htmlFor={`unit-${index}`} className="text-xs">Unit</Label>
                  <Input id={`unit-${index}`} value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} required placeholder="e.g. pcs" />
                </div>
                <div className="col-span-1">
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Barang
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kirim Pengajuan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
