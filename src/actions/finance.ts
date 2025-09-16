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
  orderBy,
  where
} from 'firebase/firestore';
import type { FinanceRecord } from '@/lib/types';

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

// Get all finance records
export async function getFinanceRecords({ siteId }: { siteId?: string } = {}): Promise<FinanceRecord[]> {
  try {
    let q = query(collection(db, 'finance'), orderBy('date', 'desc'));

    if (siteId) {
        q = query(collection(db, 'finance'), where('projectId', '==', siteId), orderBy('date', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const records: FinanceRecord[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        records.push({ id: doc.id, ...data } as FinanceRecord);
    });
    return records;
  } catch (error) {
    console.error("Error fetching finance records:", error);
    return [];
  }
}

// Get a single finance record by ID
export async function getFinanceRecord(id: string): Promise<FinanceRecord | null> {
  try {
    const docRef = doc(db, 'finance', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = convertTimestampsToDates(docSnap.data());
      return { id: docSnap.id, ...data } as FinanceRecord;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching finance record ${id}:`, error);
    return null;
  }
}

// Create a new finance record
export async function createFinanceRecord(record: Omit<FinanceRecord, 'id'>): Promise<string> {
    const recordData = {
        ...record,
        amount: Number(record.amount) || 0,
        date: new Date(record.date),
    };
    const docRef = await addDoc(collection(db, 'finance'), recordData);
    return docRef.id;
}

// Update an existing finance record
export async function updateFinanceRecord(id: string, record: Partial<Omit<FinanceRecord, 'id'>>): Promise<void> {
  const docRef = doc(db, 'finance', id);
  const recordData = { ...record };
  if (recordData.amount) {
      recordData.amount = Number(recordData.amount) || 0;
  }
  if (recordData.date) {
      recordData.date = new Date(recordData.date);
  }
  await updateDoc(docRef, recordData);
}

// Delete a finance record
export async function deleteFinanceRecord(id: string): Promise<void> {
  const docRef = doc(db, 'finance', id);
  await deleteDoc(docRef);
}
