

'use server';

import { db, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { PaymentRequest } from '@/lib/types';
import { createPaymentRequest as createPaymentRequestFromFuel } from './fuel'; // Renaming to avoid conflict


// Helper to upload base64 file to Firebase Storage and get URL
async function uploadFileAndGetURL(path: string, base64Data: string): Promise<{ downloadURL: string, fileName: string }> {
    if (!base64Data || !base64Data.startsWith('data:')) {
        throw new Error('Invalid file data provided.');
    }
    const fileName = `doc-${Date.now()}`;
    const storageRef = ref(storage, path + '/' + fileName);
    const uploadResult = await uploadString(storageRef, base64Data, 'data_url');
    const downloadURL = await getDownloadURL(uploadResult.ref);
    return { downloadURL, fileName };
}

export async function createPaymentRequest(
    data: Omit<PaymentRequest, 'id' | 'status' | 'requestDate'> & { documentDataUri?: string }
): Promise<{ success: boolean; message: string; newRequest?: PaymentRequest; }> {
    return createPaymentRequestFromFuel(data); // Defer to the implementation in fuel.ts
}


export async function getPaymentRequests({ status }: { status?: PaymentRequest['status'] } = {}): Promise<PaymentRequest[]> {
  try {
    let q;
    
    if(status) {
        q = query(collection(db, 'paymentRequests'), where('status', '==', status));
    } else {
        q = query(collection(db, 'paymentRequests'));
    }

    const querySnapshot = await getDocs(q);
    const requests: PaymentRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        requestDate: (data.requestDate as Timestamp).toDate(),
        processedDate: data.processedDate ? (data.processedDate as Timestamp).toDate() : undefined,
      } as PaymentRequest);
    });
     // Sort in application code to avoid composite index
    return requests.sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  } catch (error) {
    console.error("Error fetching payment requests:", error);
    return [];
  }
}

export async function updatePaymentRequestStatus(
  requestId: string,
  status: 'Approved' | 'Rejected',
  processorId: string,
  processorName: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, 'paymentRequests', requestId);
    const processedDate = new Date();
    
    await updateDoc(docRef, {
        status,
        processedById: processorId,
        processedByName: processorName,
        processedDate,
    });
    
    return { success: true, message: 'Status pengajuan berhasil diperbarui.' };
  } catch (error) {
    console.error("Error updating payment request:", error);
    return { success: false, message: 'Gagal memperbarui status pengajuan.' };
  }
}
