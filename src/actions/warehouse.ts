
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
} from 'firebase/firestore';
import type { WarehouseItem } from '@/lib/types';

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
