'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import type { PurchaseRequest, PurchaseRequestItem } from '@/lib/types';
import { getEmployees } from './employees';
import { createFinanceRecord } from './finance';

// Helper to convert Firestore Timestamps to Dates in a document
function convertTimestampsToDates(docData: any) {
    if (!docData) return docData;
    const data = { ...docData };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
        }
    }
    // Also convert nested timestamps in items array
    if (data.items && Array.isArray(data.items)) {
        data.items = data.items.map((item: any) => convertTimestampsToDates(item));
    }
    return data;
}

// Get all purchase requests, optionally filtered by site
export async function getPurchaseRequests({ siteId }: { siteId?: string } = {}): Promise<PurchaseRequest[]> {
  try {
    let q = query(collection(db, 'purchaseRequests'), orderBy('requestDate', 'desc'));

    if (siteId) {
        q = query(collection(db, 'purchaseRequests'), where('projectId', '==', siteId), orderBy('requestDate', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    const requests: PurchaseRequest[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        requests.push({ id: doc.id, ...data } as PurchaseRequest);
    });
    return requests;
  } catch (error) {
    console.error("Error fetching purchase requests:", error);
    return [];
  }
}

// Get purchase requests for a specific employee (requester)
export async function getPurchaseRequestsByEmployee(employeeId: string): Promise<PurchaseRequest[]> {
  try {
    const q = query(collection(db, 'purchaseRequests'), where('requesterId', '==', employeeId), orderBy('requestDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const requests: PurchaseRequest[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        requests.push({ id: doc.id, ...data } as PurchaseRequest);
    });
    return requests;
  } catch (error) {
    console.error(`Error fetching requests for employee ${employeeId}:`, error);
    return [];
  }
}

// Create a new purchase request
export async function createPurchaseRequest(request: Omit<PurchaseRequest, 'id' | 'status' | 'requestDate'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'purchaseRequests'), {
      ...request,
      requestDate: new Date(),
      status: 'Pending',
      totalEstimatedPrice: request.items.reduce((sum, item) => sum + ((item.estimatedPrice || 0) * item.quantity), 0),
  });
  return docRef.id;
}


// Update a purchase request status and other details (for Purchasing and Finance)
export async function updatePurchaseRequest(id: string, updates: Partial<PurchaseRequest>): Promise<void> {
  const docRef = doc(db, 'purchaseRequests', id);
  const updateData = { ...updates };

  // If items are being updated, recalculate the actual price
  if (updateData.items) {
      updateData.totalActualPrice = updateData.items.reduce((sum, item) => sum + ((item.actualPrice || 0) * item.quantity), 0);
  }
  
  await updateDoc(docRef, updateData);

  // If the status is 'Approved by Finance', create a corresponding finance record
  if (updates.status === 'Approved by Finance') {
    const requestSnap = await getDoc(docRef);
    const requestData = requestSnap.data() as PurchaseRequest;
    
    // Ensure totalActualPrice is calculated if not already in updates
    const finalPrice = updateData.totalActualPrice ?? requestData.totalActualPrice ?? requestData.totalEstimatedPrice;

    if (finalPrice > 0) {
        await createFinanceRecord({
            projectId: requestData.projectId,
            projectName: requestData.projectName,
            type: 'expense',
            amount: finalPrice,
            description: `Pembelian barang dari pengajuan #${requestData.id.substring(0, 6)}`,
            date: new Date(),
            category: 'Purchasing',
        });
    }
  }
}


// Delete a purchase request
export async function deletePurchaseRequest(id: string): Promise<void> {
  const docRef = doc(db, 'purchaseRequests', id);
  await deleteDoc(docRef);
}
