

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
export async function getPurchaseRequests({ siteId, status }: { siteId?: string, status?: PurchaseRequest['status'] } = {}): Promise<PurchaseRequest[]> {
  try {
    const q = collection(db, 'purchaseRequests');
    
    let conditions: any[] = [];
    if(siteId) {
        conditions.push(where('projectId', '==', siteId));
    }
    if (status) {
        conditions.push(where('status', '==', status));
    }
    
    const finalQuery = conditions.length > 0 ? query(q, ...conditions) : query(q, orderBy('requestDate', 'desc'));

    const querySnapshot = await getDocs(finalQuery);
    const requests: PurchaseRequest[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        requests.push({ id: doc.id, ...data } as PurchaseRequest);
    });
    
    // Manual sort if no specific ordering is done by Firestore
    if(conditions.length > 0) {
        requests.sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }

    return requests;
  } catch (error) {
    console.error("Error fetching purchase requests:", error);
    return [];
  }
}

// Get purchase requests for a specific employee (requester)
export async function getPurchaseRequestsByEmployee(employeeId: string): Promise<PurchaseRequest[]> {
  try {
    // Removed orderBy from the query to avoid needing a composite index
    const q = query(collection(db, 'purchaseRequests'), where('requesterId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const requests: PurchaseRequest[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        requests.push({ id: doc.id, ...data } as PurchaseRequest);
    });
    // Sort the results in the application code
    return requests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
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
  });
  return docRef.id;
}


// Update a purchase request status and other details (for Purchasing and Finance)
export async function updatePurchaseRequest(id: string, updates: Partial<PurchaseRequest>): Promise<void> {
  const docRef = doc(db, 'purchaseRequests', id);
  const updateData: { [key: string]: any } = { ...updates };

  if (updateData.proposedAmount) {
    updateData.proposedAmount = Number(updateData.proposedAmount);
  }

  // If status is being updated, add the corresponding date
  if (updateData.status) {
    const now = new Date();
    if (updateData.status === 'Verified') {
        updateData.verifiedDate = now;
    }
    if (updateData.status === 'Approved') {
        updateData.approvedDate = now;
    }
  }
  
  await updateDoc(docRef, updateData);

  // If the status is 'Approved', create a corresponding finance record
  if (updates.status === 'Approved') {
    const requestSnap = await getDoc(docRef);
    if (!requestSnap.exists()) {
        throw new Error("Purchase request not found after update.");
    }
    const requestData = requestSnap.data() as PurchaseRequest;
    
    // The final price is the proposedAmount set by Purchasing
    const finalPrice = requestData.proposedAmount;

    if (finalPrice && finalPrice > 0 && requestData.projectId && requestData.projectName) {
        const itemNames = requestData.items.map(item => item.name).join(', ');
        await createFinanceRecord({
            projectId: requestData.projectId,
            projectName: requestData.projectName,
            type: 'expense',
            amount: finalPrice,
            description: `Pembelian: ${itemNames}`,
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
