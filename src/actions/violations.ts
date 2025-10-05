
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
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { ViolationRecord } from '@/lib/types';

// Helper to convert Firestore Timestamps to Dates in a document
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
async function uploadFileAndGetURL(base64Data: string, employeeId: string): Promise<{ fileUrl: string, fileName: string }> {
    if (!base64Data || !base64Data.startsWith('data:')) {
        throw new Error('Invalid file data provided.');
    }
    
    const mimeTypeMatch = base64Data.match(/data:(.*);base64,/);
    if (!mimeTypeMatch) throw new Error('Invalid data URI format.');

    const mimeType = mimeTypeMatch[1];
    const extension = mimeType.split('/')[1] || 'bin';
    const fileName = `violation-${employeeId}-${Date.now()}.${extension}`;
    const storageRef = ref(storage, `violation-documents/${fileName}`);
    
    const uploadResult = await uploadString(storageRef, base64Data, 'data_url');
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return { fileUrl: downloadURL, fileName };
}

// Get all violation records
export async function getViolationRecords(): Promise<ViolationRecord[]> {
  try {
    const q = query(collection(db, 'violations'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const records: ViolationRecord[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        records.push({ id: doc.id, ...data } as ViolationRecord);
    });
    return records;
  } catch (error) {
    console.error("Error fetching violation records:", error);
    return [];
  }
}

// Create a new violation record
export async function createViolationRecord(record: Omit<ViolationRecord, 'id'>): Promise<string> {
    const recordData: { [key: string]: any } = {
        ...record,
        date: new Date(record.date),
    };
    
    if (recordData.fileUrl && recordData.fileUrl.startsWith('data:')) {
        const { fileUrl, fileName } = await uploadFileAndGetURL(recordData.fileUrl, record.employeeId);
        recordData.fileUrl = fileUrl;
        recordData.fileName = fileName;
    }
    
    const docRef = await addDoc(collection(db, 'violations'), recordData);
    return docRef.id;
}

// Update an existing violation record
export async function updateViolationRecord(id: string, updates: Partial<Omit<ViolationRecord, 'id'>>): Promise<void> {
  const docRef = doc(db, 'violations', id);
  const updateData: { [key: string]: any } = { ...updates };
  
  if (updateData.date) {
    updateData.date = new Date(updateData.date);
  }
  
  if (updateData.fileUrl && updateData.fileUrl.startsWith('data:')) {
    const { fileUrl, fileName } = await uploadFileAndGetURL(updateData.fileUrl, updates.employeeId!);
    updateData.fileUrl = fileUrl;
    updateData.fileName = fileName;
  }
  
  await updateDoc(docRef, updateData);
}

// Delete a violation record
export async function deleteViolationRecord(id: string): Promise<void> {
    const docRef = doc(db, 'violations', id);
    await deleteDoc(docRef);
}
