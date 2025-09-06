'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, query, where, writeBatch } from 'firebase/firestore';
import type { AttendanceRecord } from '@/lib/types';

// Get all attendance records for a specific period
export async function getAttendanceByPeriod(period: string): Promise<AttendanceRecord[]> {
  const q = query(collection(db, 'attendance'), where('period', '==', period));
  const querySnapshot = await getDocs(q);
  const records: AttendanceRecord[] = [];
  querySnapshot.forEach((doc) => {
    records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
  });
  return records;
}

// Get a single attendance record
export async function getAttendanceByEmployeeAndPeriod(employeeId: string, period: string): Promise<AttendanceRecord | null> {
    const docId = `${employeeId}_${period}`;
    const docRef = doc(db, 'attendance', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AttendanceRecord;
    } else {
        return null;
    }
}


// Create or update an attendance record
export async function saveAttendanceRecord(data: Omit<AttendanceRecord, 'id'>): Promise<void> {
  const { employeeId, period } = data;
  const docId = `${employeeId}_${period}`;
  const docRef = doc(db, 'attendance', docId);
  await setDoc(docRef, data, { merge: true });
}

// Import multiple attendance records
export async function importAttendanceRecords(records: Omit<AttendanceRecord, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);
    
    records.forEach(record => {
        const docId = `${record.employeeId}_${record.period}`;
        const docRef = doc(db, 'attendance', docId);
        batch.set(docRef, record, { merge: true });
    });

    await batch.commit();
}
