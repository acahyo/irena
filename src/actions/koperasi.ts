'use server';

import { db, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import type { KoperasiItem, KoperasiOrder } from '@/lib/types';

// Helper to convert Firestore Timestamps
function convertTimestampsToDates(docData: any) {
    if (!docData) return docData;
    const data = { ...docData };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
        }
    }
    return data;
}

// Helper to upload base64 file to Firebase Storage and get URL
async function uploadFileAndGetURL(base64Data: string, itemId: string): Promise<string> {
    if (!base64Data || !base64Data.startsWith('data:')) {
        if (base64Data && (base64Data.startsWith('http') || base64Data.startsWith('https'))) {
            return base64Data;
        }
        throw new Error('Invalid file data provided.');
    }
    
    const storageRef = ref(storage, `koperasi/${itemId}-${Date.now()}`);
    const uploadResult = await uploadString(storageRef, base64Data, 'data_url');
    return await getDownloadURL(uploadResult.ref);
}


// --- Koperasi Items ---

export async function getKoperasiItems(): Promise<KoperasiItem[]> {
  const querySnapshot = await getDocs(collection(db, 'koperasiItems'));
  const items: KoperasiItem[] = [];
  querySnapshot.forEach((doc) => {
    items.push({ id: doc.id, ...doc.data() } as KoperasiItem);
  });
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createKoperasiItem(item: Omit<KoperasiItem, 'id'>): Promise<string> {
    const itemData = { ...item, price: Number(item.price), stock: Number(item.stock) };
    
    const docRef = await addDoc(collection(db, 'koperasiItems'), { name: 'pending', price: 0, stock: 0 });
    
    if (itemData.imageUrl && itemData.imageUrl.startsWith('data:')) {
        itemData.imageUrl = await uploadFileAndGetURL(itemData.imageUrl, `item-${docRef.id}`);
    }
    
    await updateDoc(docRef, itemData);
    return docRef.id;
}

export async function updateKoperasiItem(id: string, item: Partial<KoperasiItem>): Promise<void> {
  const itemData: Partial<KoperasiItem> = { ...item };
  if(itemData.price) itemData.price = Number(itemData.price);
  if(itemData.stock) itemData.stock = Number(itemData.stock);

  if (itemData.imageUrl && itemData.imageUrl.startsWith('data:')) {
      itemData.imageUrl = await uploadFileAndGetURL(itemData.imageUrl, `item-${id}`);
  }

  const docRef = doc(db, 'koperasiItems', id);
  await updateDoc(docRef, itemData);
}

export async function deleteKoperasiItem(id: string): Promise<void> {
  const docRef = doc(db, 'koperasiItems', id);
  await deleteDoc(docRef);
}


// --- Koperasi Orders ---

export async function getKoperasiOrders({ employeeId }: { employeeId?: string } = {}): Promise<KoperasiOrder[]> {
    let q = query(collection(db, 'koperasiOrders'), orderBy('orderDate', 'desc'));
    if (employeeId) {
        q = query(collection(db, 'koperasiOrders'), where('employeeId', '==', employeeId), orderBy('orderDate', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const orders: KoperasiOrder[] = [];
    querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...convertTimestampsToDates(doc.data()) } as KoperasiOrder);
    });

    return orders;
}

export async function createKoperasiOrder(order: Omit<KoperasiOrder, 'id' | 'orderDate' | 'status'>): Promise<string> {
  const batch = writeBatch(db);

  // 1. Create the order document
  const orderRef = doc(collection(db, 'koperasiOrders'));
  batch.set(orderRef, {
    ...order,
    orderDate: new Date(),
    status: 'Pending',
  });

  // 2. Decrement stock for each item
  for (const item of order.items) {
    const itemRef = doc(db, 'koperasiItems', item.itemId);
    const itemDoc = await getDoc(itemRef);
    if (itemDoc.exists()) {
      const currentStock = itemDoc.data().stock || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Stok tidak mencukupi untuk barang: ${item.name}`);
      }
      batch.update(itemRef, { stock: currentStock - item.quantity });
    } else {
      throw new Error(`Barang tidak ditemukan: ${item.name}`);
    }
  }

  await batch.commit();
  return orderRef.id;
}


export async function updateKoperasiOrder(id: string, updates: Partial<KoperasiOrder>): Promise<void> {
    const orderRef = doc(db, 'koperasiOrders', id);
    const updateData: any = { ...updates };
    
    if (updateData.pickupInfo && updateData.pickupInfo.date) {
        updateData.pickupInfo.date = new Date(updateData.pickupInfo.date);
    }
    
    if (updateData.completionPhotoUrl && updateData.completionPhotoUrl.startsWith('data:')) {
        updateData.completionPhotoUrl = await uploadFileAndGetURL(updateData.completionPhotoUrl, `order-completion-${id}`);
    }

    await updateDoc(orderRef, updateData);
}
