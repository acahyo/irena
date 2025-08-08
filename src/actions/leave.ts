
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { LeaveRequest } from '@/lib/types';

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

// Get all leave requests
export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const querySnapshot = await getDocs(collection(db, 'leaveRequests'));
  const requests: LeaveRequest[] = [];
  querySnapshot.forEach((doc) => {
    const data = convertTimestampsToDates(doc.data());
    requests.push({ id: doc.id, ...data } as LeaveRequest);
  });
  return requests.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}

// Create a new leave request
export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'leaveRequests'), {
      ...request,
      status: 'Pending',
  });
  return docRef.id;
}

// Update an existing leave request status
export async function updateLeaveRequestStatus(id: string, status: 'Approved' | 'Rejected'): Promise<void> {
  const docRef = doc(db, 'leaveRequests', id);
  await updateDoc(docRef, { status });
}

// Delete a leave request
export async function deleteLeaveRequest(id: string): Promise<void> {
  const docRef = doc(db, 'leaveRequests', id);
  await deleteDoc(docRef);
}
