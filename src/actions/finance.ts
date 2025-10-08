
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  Timestamp,
  query,
  orderBy,
  where,
  deleteDoc
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

// Get all finance records, optionally filtered by projectId
export async function getFinanceRecords({ projectId }: { projectId?: string } = {}): Promise<FinanceRecord[]> {
  try {
    let q = query(collection(db, 'finance'), orderBy('date', 'desc'));

    if (projectId) {
        q = query(collection(db, 'finance'), where('projectId', '==', projectId), orderBy('date', 'desc'));
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


// This function is now only used internally by other actions (purchasing, payment-requests)
export async function createFinanceRecord(record: Omit<FinanceRecord, 'id'>): Promise<string> {
    const recordData = {
        ...record,
        amount: Number(record.amount) || 0,
        date: new Date(record.date),
    };
    const docRef = await addDoc(collection(db, 'finance'), recordData);
    return docRef.id;
}
