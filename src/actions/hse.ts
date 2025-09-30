
'use server';

import { db, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import type { HseRecord } from '@/lib/types';


// Helper to convert Timestamps
function convertTimestampsToDates(data: any): any {
    if (!data) return data;
    const newData = { ...data };
    for (const key in newData) {
        if (newData[key] instanceof Timestamp) {
            newData[key] = newData[key].toDate();
        }
    }
    return newData;
}


// Helper to upload base64 file to Firebase Storage and get URL
async function uploadFileAndGetURL(base64Data: string, category: string, fieldName: string): Promise<{ fileUrl: string, fileName: string }> {
    if (!base64Data || !base64Data.startsWith('data:')) {
        throw new Error('Invalid file data provided.');
    }
    
    const mimeTypeMatch = base64Data.match(/data:(.*);base64,/);
    if (!mimeTypeMatch) throw new Error('Invalid data URI format.');

    const mimeType = mimeTypeMatch[1];
    const extension = mimeType.split('/')[1] || 'bin';
    const fileName = `${category}-${fieldName}-${Date.now()}.${extension}`;
    const storageRef = ref(storage, `hse-documents/${fileName}`);
    
    const uploadResult = await uploadString(storageRef, base64Data, 'data_url');
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return { fileUrl: downloadURL, fileName };
}


// Get all HSE records
export async function getHseRecords(): Promise<HseRecord[]> {
  try {
    const q = query(collection(db, 'hseRecords'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const records: HseRecord[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        records.push({ id: doc.id, ...data } as HseRecord);
    });
    return records;
  } catch (error) {
    console.error("Error fetching HSE records:", error);
    return [];
  }
}

// Create a new HSE record
export async function createHseRecord(record: Omit<HseRecord, 'id'>): Promise<string> {
    const recordData: { [key: string]: any } = {
        ...record,
        date: new Date(record.date),
        hasFine: record.hasFine === true || (record as any).hasFine === 'on',
        fineAmount: record.fineAmount ? Number(record.fineAmount) : undefined,
    };
    
    // Handle file upload
    if (recordData.fileUrl && recordData.fileUrl.startsWith('data:')) {
        const { fileUrl, fileName } = await uploadFileAndGetURL(recordData.fileUrl, record.category, 'attachment');
        recordData.fileUrl = fileUrl;
        recordData.fileName = fileName;
    }
    
    // Handle fine attachment upload
    if (recordData.fineAttachmentUrl && recordData.fineAttachmentUrl.startsWith('data:')) {
        const { fileUrl: fineFileUrl } = await uploadFileAndGetURL(recordData.fineAttachmentUrl, record.category, 'fine-attachment');
        recordData.fineAttachmentUrl = fineFileUrl;
    }
    
    const docRef = await addDoc(collection(db, 'hseRecords'), recordData);
    return docRef.id;
}


// Delete an HSE record
export async function deleteHseRecord(id: string): Promise<void> {
    // Optionally: delete associated file from storage
    const docRef = doc(db, 'hseRecords', id);
    await deleteDoc(docRef);
}
