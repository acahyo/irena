
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

// Delete a warehouse item
export async function deleteWarehouseItem(id: string): Promise<void> {
  const docRef = doc(db, 'warehouseItems', id);
  await deleteDoc(docRef);
}


// New function to update stock based on an approved purchase
export async function updateStockForPurchase(purchasedItems: PurchaseRequestItem[]): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // 1. Get all warehouse item documents that need updating in a single query if possible
    // For simplicity with name matching, we'll fetch them all first. This is less efficient for very large warehouses.
    const warehouseItemsSnapshot = await getDocs(collection(db, 'warehouseItems'));
    const warehouseItemsMap = new Map(warehouseItemsSnapshot.docs.map(d => [d.data().name.toLowerCase(), d]));

    // 2. Perform reads and prepare writes
    for (const item of purchasedItems) {
      const warehouseDoc = warehouseItemsMap.get(item.name.toLowerCase());

      if (warehouseDoc) {
        const warehouseRef = doc(db, 'warehouseItems', warehouseDoc.id);
        const warehouseData = warehouseDoc.data() as WarehouseItem;
        const newStock = warehouseData.stock - item.quantity;
        
        if (newStock < 0) {
          throw new Error(`Stok tidak mencukupi untuk barang: ${item.name}. Stok saat ini: ${warehouseData.stock}, dibutuhkan: ${item.quantity}`);
        }
        transaction.update(warehouseRef, { stock: newStock });
      } else {
        throw new Error(`Barang gudang tidak ditemukan: ${item.name}`);
      }
    }
  });
}
