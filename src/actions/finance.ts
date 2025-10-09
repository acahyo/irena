
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, getDocs, orderBy, Timestamp, where } from 'firebase/firestore';
import type { FinanceRecord } from '@/lib/types';

// Create a new finance record
export async function createFinanceRecord(record: Omit<FinanceRecord, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'financeRecords'), {
    ...record,
    date: new Date(record.date),
  });
  return docRef.id;
}

// Get finance records with optional filters
export async function getFinanceRecords({ projectId, type }: { projectId?: string, type?: 'income' | 'expense' } = {}): Promise<FinanceRecord[]> {
  try {
    const recordsRef = collection(db, 'financeRecords');
    let conditions: any[] = [];
    
    if (projectId) {
        conditions.push(where('projectId', '==', projectId));
    }
    if (type) {
        conditions.push(where('type', '==', type));
    }

    const q = conditions.length > 0 ? query(recordsRef, ...conditions, orderBy('date', 'desc')) : query(recordsRef, orderBy('date', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const records: FinanceRecord[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
            id: doc.id,
            ...data,
            date: (data.date as Timestamp).toDate(),
        } as FinanceRecord);
    });
    return records;
  } catch (error) {
    console.error("Error fetching finance records:", error);
    return [];
  }
}
