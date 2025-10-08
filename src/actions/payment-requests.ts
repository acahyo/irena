
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
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { PaymentRequest } from '@/lib/types';
import { createFinanceRecord } from './finance';


// Helper to upload base64 file to Firebase Storage and get URL
async function uploadFileAndGetURL(base64Data: string, path: string): Promise<{ downloadURL: string, fileName: string }> {
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
    try {
        const { documentDataUri, ...rest } = data;
        
        const finalData: Omit<PaymentRequest, 'id'> = {
            ...rest,
            amount: Number(rest.amount) || 0,
            requestDate: new Date(),
            status: 'Pending',
        };

        if (documentDataUri) {
            const { downloadURL, fileName } = await uploadFileAndGetURL(documentDataUri, `payment-requests/${data.requesterId}`);
            finalData.documentUrl = downloadURL;
            finalData.documentName = fileName;
        }

        const docRef = await addDoc(collection(db, 'paymentRequests'), finalData);
        
        const newRequest: PaymentRequest = {
            id: docRef.id,
            ...finalData,
        }

        return { success: true, message: 'Pengajuan berhasil dikirim.', newRequest };
    } catch (error) {
        console.error("Error creating payment request:", error);
        return { success: false, message: 'Gagal mengirim pengajuan.' };
    }
}


export async function getPaymentRequests({ status }: { status?: PaymentRequest['status'] } = {}): Promise<PaymentRequest[]> {
  try {
    let q = query(collection(db, 'paymentRequests'), orderBy('requestDate', 'desc'));
    
    if(status) {
        q = query(collection(db, 'paymentRequests'), where('status', '==', status), orderBy('requestDate', 'desc'));
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
    return requests;
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
    
    // If approved, create a finance record
    if (status === 'Approved') {
      const requestSnap = await getDoc(docRef);
      if (requestSnap.exists()) {
        const requestData = requestSnap.data() as PaymentRequest;
        await createFinanceRecord({
          projectId: 'OFFICE', // Payment requests are from office roles
          projectName: 'Office Operational',
          type: 'expense',
          amount: requestData.amount,
          description: `Pembayaran: ${requestData.paymentName} (${requestData.category})`,
          date: processedDate,
          category: 'Payment Request',
        });
      }
    }
    
    return { success: true, message: 'Status pengajuan berhasil diperbarui.' };
  } catch (error) {
    console.error("Error updating payment request:", error);
    return { success: false, message: 'Gagal memperbarui status pengajuan.' };
  }
}
