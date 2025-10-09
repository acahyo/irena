
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import type { WarehouseItem, PurchaseRequestItem } from '@/lib/types';

// Get all warehouse items
export async function getWarehouseItems(): Promise<WarehouseItem[]> {
  try {
    const q = query(collection(db, 'warehouseItems'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    const items: WarehouseItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as WarehouseItem);
    });
    return items;
  } catch (error) {
    console.error("Error fetching warehouse items:", error);
    return [];
  }
}

// Create a new warehouse item
export async function createWarehouseItem(item: Omit<WarehouseItem, 'id'>): Promise<string> {
  const itemData = {
    ...item,
    stock: Number(item.stock) || 0,
    price: Number(item.price) || 0,
  };
  const docRef = await addDoc(collection(db, 'warehouseItems'), itemData);
  return docRef.id;
}

// Update an existing warehouse item
export async function updateWarehouseItem(id: string, updates: Partial<WarehouseItem>): Promise<void> {
  const docRef = doc(db, 'warehouseItems', id);
  const updateData: { [key: string]: any } = { ...updates };
  
  if (updates.stock !== undefined) {
    updateData.stock = Number(updates.stock);
  }
  
  if (updates.price !== undefined) {
    updateData.price = Number(updates.price);
  }

  await updateDoc(docRef, updateData);
}

export async function updateWarehouseItemStock(id: string, newStock: number): Promise<void> {
    const docRef = doc(db, 'warehouseItems', id);
    await updateDoc(docRef, { stock: newStock });
}

// Delete a warehouse item
export async function deleteWarehouseItem(id: string): Promise<void> {
  const docRef = doc(db, 'warehouseItems', id);
  await deleteDoc(docRef);
}


// New function to update stock based on an approved purchase
export async function updateStockForPurchase(purchasedItems: PurchaseRequestItem[]): Promise<void> {
  const batch = writeBatch(db);
  const warehouseItemsSnapshot = await getDocs(collection(db, 'warehouseItems'));
  const warehouseItemsMap = new Map(warehouseItemsSnapshot.docs.map(d => [d.data().name.toLowerCase(), { id: d.id, ...d.data() } as WarehouseItem]));
  
  for (const item of purchasedItems) {
      const warehouseItem = warehouseItemsMap.get(item.name.toLowerCase());
      if (warehouseItem) {
          const warehouseRef = doc(db, 'warehouseItems', warehouseItem.id);
          const newStock = warehouseItem.stock - item.quantity;
          if (newStock < 0) {
              throw new Error(`Stok tidak mencukupi untuk barang: ${item.name}. Stok saat ini: ${warehouseItem.stock}, dibutuhkan: ${item.quantity}`);
          }
          batch.update(warehouseRef, { stock: newStock });
      } else {
           throw new Error(`Barang gudang tidak ditemukan: ${item.name}`);
      }
  }

  await batch.commit();
}
