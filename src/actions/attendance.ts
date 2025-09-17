'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import type { AttendanceRecord } from '@/lib/types';

// Get all attendance records for a specific period (YYYY-MM)
export async function getAttendanceByPeriod(period: string): Promise<AttendanceRecord[]> {
  try {
    const q = query(collection(db, 'attendance'), where('period', '==', period));
    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];
    querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
    });
    return records;
  } catch (error) {
      console.error(`Error fetching attendance for period ${period}, returning empty array:`, error);
      return [];
  }
}


// Get a single attendance record for a specific employee and period
export async function getAttendanceByEmployeeAndPeriod(employeeId: string, period: string): Promise<AttendanceRecord | null> {
    try {
        const docId = `${employeeId}_${period}`;
        const docRef = doc(db, 'attendance', docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as AttendanceRecord;
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error fetching attendance for employee ${employeeId} and period ${period}, returning null:`, error);
        return null;
    }
}


// Create or update an attendance record
export async function saveAttendanceRecord(data: Omit<AttendanceRecord, 'id'>): Promise<void> {
  const { employeeId, period } = data;
  const docId = `${employeeId}_${period}`;
  const docRef = doc(db, 'attendance', docId);
  const dateFromPeriod = new Date(period + '-01'); // Ensure date is correctly derived from period
  await setDoc(docRef, { ...data, date: dateFromPeriod }, { merge: true });
}

// Import multiple attendance records
export async function importAttendanceRecords(records: Omit<AttendanceRecord, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);
    
    records.forEach(record => {
        const docId = `${record.employeeId}_${record.period}`;
        const docRef = doc(db, 'attendance', docId);
        const dateFromPeriod = new Date(record.period + '-01');
        batch.set(docRef, { ...record, date: dateFromPeriod }, { merge: true });
    });

    await batch.commit();
}
