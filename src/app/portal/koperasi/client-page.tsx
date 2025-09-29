'use client';

import { useState, useMemo, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Employee, KoperasiItem, KoperasiOrder, KoperasiOrderItem } from '@/lib/types';
import { createKoperasiOrder } from '@/actions/koperasi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Minus, Plus, ShoppingCart, Trash2, Package } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'Completed': return 'default';
    case 'Rejected': return 'destructive';
    default: return 'outline';
  }
};

export default function KoperasiClientPage({ employee, initialItems, initialOrders }: { employee: Employee, initialItems: KoperasiItem[], initialOrders: KoperasiOrder[] }) {
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleAddToCart = (itemId: string, quantity: number) => {
    const newCart = new Map(cart);
    const currentQty = newCart.get(itemId) || 0;
    const item = initialItems.find(i => i.id === itemId);
    if (!item) return;
    
    const newQty = Math.max(0, Math.min(item.stock, currentQty + quantity));
    
    if (newQty > 0) {
      newCart.set(itemId, newQty);
    } else {
      newCart.delete(itemId);
    }
    setCart(newCart);
  };
  
  const removeFromCart = (itemId: string) => {
    const newCart = new Map(cart);
    newCart.delete(itemId);
    setCart(newCart);
  }

  const { cartItems, totalCartPrice, totalSpentThisMonth } = useMemo(() => {
    const items: (KoperasiItem & { quantity: number })[] = [];
    let cartTotal = 0;
    for (const [itemId, quantity] of cart.entries()) {
      const item = initialItems.find(i => i.id === itemId);
      if (item) {
        items.push({ ...item, quantity });
        cartTotal += item.price * quantity;
      }
    }
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const spentThisMonth = initialOrders
      .filter(order => {
        const orderDate = new Date(order.orderDate);
        return (
          order.status !== 'Rejected' &&
          orderDate.getMonth() === currentMonth &&
          orderDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, order) => sum + order.totalPrice, 0);

    return { cartItems: items, totalCartPrice: cartTotal, totalSpentThisMonth: spentThisMonth };
  }, [cart, initialItems, initialOrders]);
  
  const remainingLimit = (employee.koperasiLimit || 0) - totalSpentThisMonth - totalCartPrice;

  const handleSubmitOrder = () => {
      const availableLimit = (employee.koperasiLimit || 0) - totalSpentThisMonth;

      if (totalCartPrice > availableLimit) {
          toast({ variant: 'destructive', title: 'Error', description: `Total belanja melebihi sisa limit Anda bulan ini (${formatCurrency(availableLimit)}).` });
          return;
      }
      if (cartItems.length === 0) {
          toast({ variant: 'destructive', title: 'Error', description: 'Keranjang belanja kosong.' });
          return;
      }

      startTransition(async () => {
          const orderItems: KoperasiOrderItem[] = cartItems.map(item => ({
              itemId: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
          }));

          try {
              await createKoperasiOrder({
                  employeeId: employee.id,
                  employeeName: employee.name,
                  items: orderItems,
                  totalPrice: totalCartPrice,
              });
              toast({ title: 'Sukses!', description: 'Pesanan Anda berhasil dibuat dan sedang diproses.' });
              setCart(new Map());
              router.refresh();
          } catch (error: any) {
              toast({ variant: 'destructive', title: 'Error', description: error.message || 'Gagal membuat pesanan.' });
          }
      });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader><CardTitle>Barang Koperasi</CardTitle><CardDescription>Pilih barang yang ingin Anda beli.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {initialItems.map(item => (
              <Card key={item.id} className="flex flex-col">
                <div className="relative aspect-square w-full">
                    <Image src={item.imageUrl || `https://picsum.photos/seed/${item.id}/300/300`} alt={item.name} fill className="object-cover rounded-t-lg" />
                </div>
                <CardHeader>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <CardDescription>{formatCurrency(item.price)}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-xs text-muted-foreground">Stok: {item.stock}</p>
                </CardContent>
                <div className="p-4 pt-0">
                  <div className="flex items-center justify-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleAddToCart(item.id, -1)} disabled={!cart.has(item.id)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input readOnly value={cart.get(item.id) || 0} className="w-16 text-center" />
                    <Button variant="outline" size="icon" onClick={() => handleAddToCart(item.id, 1)} disabled={item.stock <= (cart.get(item.id) || 0)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
             {initialItems.length === 0 && (
                <div className="md:col-span-2 xl:col-span-3 text-center text-muted-foreground py-10">
                    <Package className="mx-auto h-12 w-12" />
                    <p className="mt-2">Belum ada barang yang tersedia di koperasi.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart /> Keranjang Saya</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                 {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                        <div>
                            <p>{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(item.quantity * item.price)}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                 ))}
                 {cartItems.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Keranjang kosong</p>}
             </div>
             {cartItems.length > 0 && <hr />}
             <div className="space-y-2 text-sm">
                <div className="flex justify-between font-medium"><span>Total Belanja:</span> <span>{formatCurrency(totalCartPrice)}</span></div>
                 <div className="flex justify-between"><span>Terpakai Bulan Ini:</span> <span>{formatCurrency(totalSpentThisMonth)}</span></div>
                <div className="flex justify-between"><span>Limit Anda:</span> <span>{formatCurrency(employee.koperasiLimit)}</span></div>
                <div className={`flex justify-between font-bold ${remainingLimit < 0 ? 'text-destructive' : ''}`}><span>Sisa Limit:</span> <span>{formatCurrency(remainingLimit)}</span></div>
             </div>
             <Button onClick={handleSubmitOrder} className="w-full" disabled={isPending || cartItems.length === 0}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Pesanan
            </Button>
          </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Riwayat Pesanan</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {initialOrders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell>{format(new Date(order.orderDate), 'dd/MM/yy')}</TableCell>
                                <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(order.status)}>{order.status}</Badge></TableCell>
                            </TableRow>
                        ))}
                        {initialOrders.length === 0 && <TableRow><TableCell colSpan={3} className="text-center h-24">Tidak ada riwayat pesanan.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
