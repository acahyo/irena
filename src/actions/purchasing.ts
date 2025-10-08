

'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import type { PurchaseRequest, PurchaseRequestItem } from '@/lib/types';
import { createPaymentRequest } from './payment-requests';
import { getWarehouseItems } from './warehouse';

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
  const warehouseItems = await getWarehouseItems();
  const itemsWithPrice = request.items.map(item => {
    const warehouseItem = warehouseItems.find(wi => wi.name.toLowerCase() === item.name.toLowerCase());
    return {
        ...item,
        price: warehouseItem?.price || 0,
    };
  });
    
  const docRef = await addDoc(collection(db, 'purchaseRequests'), {
      ...request,
      items: itemsWithPrice,
      requestDate: new Date(),
      status: 'Pending',
  });
  return docRef.id;
}


// Update a purchase request status and other details
export async function updatePurchaseRequest(id: string, updates: Partial<PurchaseRequest>): Promise<void> {
  const docRef = doc(db, 'purchaseRequests', id);
  const updateData: { [key: string]: any } = { ...updates };

  if (updateData.proposedAmount) {
    updateData.proposedAmount = Number(updateData.proposedAmount);
  }

  // If status is being updated, add the corresponding date
  if (updateData.status) {
    const now = new Date();
    if (updateData.status === 'Verified' || updateData.status === 'Approved by Purchasing') {
        updateData.verifiedDate = now;
    }
    if (updateData.status === 'Approved') {
        updateData.approvedDate = now;
    }
  }
  
  await updateDoc(docRef, updateData);
}

// Forward purchase request to finance as a payment request
export async function forwardToFinance(
  purchaseRequest: PurchaseRequest,
  proposedAmount: number,
  purchasingOfficerId: string,
  purchasingOfficerName: string
): Promise<{ success: boolean; message: string; }> {
  try {
    if (!proposedAmount || proposedAmount <= 0) {
      return { success: false, message: 'Proposed amount must be greater than zero.' };
    }

    const paymentName = `Pengadaan Barang: ${purchaseRequest.projectName} - ${purchaseRequest.items.map(i => i.name).join(', ')}`;

    const paymentResult = await createPaymentRequest({
      requesterId: purchasingOfficerId,
      requesterName: purchasingOfficerName,
      category: 'Pengadaan Barang',
      paymentName: paymentName,
      amount: proposedAmount,
    });

    if (paymentResult.success && paymentResult.newRequest) {
      await updateDoc(doc(db, 'purchaseRequests', purchaseRequest.id), {
        status: 'Forwarded to Finance',
        proposedAmount: proposedAmount,
        paymentRequestId: paymentResult.newRequest.id,
        verifiedDate: new Date(),
      });
      return { success: true, message: 'Pengajuan berhasil diteruskan ke Finance.' };
    } else {
      throw new Error(paymentResult.message || 'Gagal membuat pengajuan pembayaran.');
    }
  } catch (error) {
    console.error("Error forwarding to finance:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Gagal meneruskan ke Finance: ${errorMessage}` };
  }
}


// Delete a purchase request
export async function deletePurchaseRequest(id: string): Promise<void> {
  const docRef = doc(db, 'purchaseRequests', id);
  await deleteDoc(docRef);
}
