'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, writeBatch, doc } from 'firebase/firestore';
import type { PayrollRecord } from '@/lib/types';

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


// Save a new payroll record
export async function savePayrollRecord(record: Omit<PayrollRecord, 'id'>): Promise<string> {
    const recordData = {
        ...record,
        generationDate: new Date(),
    };
    const docRef = await addDoc(collection(db, 'payrollHistory'), recordData);
    return docRef.id;
}

// Save a batch of payroll records
export async function savePayrollHistoryBatch(records: Omit<PayrollRecord, 'id'>[]): Promise<{ success: boolean, count: number }> {
    if (!records || records.length === 0) {
        return { success: false, count: 0 };
    }

    const batch = writeBatch(db);
    
    records.forEach(record => {
        const docRef = doc(collection(db, 'payrollHistory'));
        const recordData = {
            ...record,
            generationDate: new Date(),
        };
        batch.set(docRef, recordData);
    });

    try {
        await batch.commit();
        return { success: true, count: records.length };
    } catch (error) {
        console.error("Error saving payroll history batch:", error);
        return { success: false, count: 0 };
    }
}


// Get all payroll records for a specific period (YYYY-MM)
export async function getPayrollHistoryByPeriod(period: string): Promise<PayrollRecord[]> {
  try {
    const q = query(collection(db, 'payrollHistory'), where('period', '==', period));
    const querySnapshot = await getDocs(q);
    const records: PayrollRecord[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        records.push({ id: doc.id, ...data } as PayrollRecord);
    });
    return records;
  } catch (error) {
      console.error(`Error fetching payroll history for period ${period}:`, error);
      return [];
  }
}
