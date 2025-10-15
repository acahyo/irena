
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp, query, where } from 'firebase/firestore';
import type { LeaveRequest } from '@/lib/types';
import { getEmployees } from './employees';

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
export async function getLeaveRequests({ siteIds }: { siteIds?: string[] } = {}): Promise<LeaveRequest[]> {
  try {
    let q = query(collection(db, 'leaveRequests'));

    const querySnapshot = await getDocs(q);
    const requests: LeaveRequest[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        requests.push({ id: doc.id, ...data } as LeaveRequest);
    });

    if (siteIds && siteIds.length > 0) {
        const siteEmployees = await getEmployees({ siteIds });
        const employeeIds = new Set(siteEmployees.map(emp => emp.id));
        const siteRequests = requests.filter(req => employeeIds.has(req.employeeId));
        return siteRequests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }

    return requests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  } catch (error) {
    console.error("Error fetching leave requests, returning empty array:", error);
    return [];
  }
}

// Get leave requests for a specific employee
export async function getLeaveRequestsByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
  try {
    const q = query(collection(db, 'leaveRequests'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const requests: LeaveRequest[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        requests.push({ id: doc.id, ...data } as LeaveRequest);
    });
    return requests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  } catch (error) {
    console.error(`Error fetching leave requests for employee ${employeeId}, returning empty array:`, error);
    return [];
  }
}


// Create a new leave request
export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'leaveRequests'), {
      ...request,
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      status: 'Pending',
  });
  return docRef.id;
}

// Update an existing leave request status (for Admin Proyek)
export async function updateLeaveRequestStatus(id: string, status: 'Approved by Admin Proyek' | 'Rejected'): Promise<void> {
  const docRef = doc(db, 'leaveRequests', id);
  await updateDoc(docRef, { status });
}

// Final approval by HR
export async function approveLeaveRequestByHR(id: string): Promise<void> {
  const docRef = doc(db, 'leaveRequests', id);
  await updateDoc(docRef, { status: 'Approved' });
}


// Delete a leave request
export async function deleteLeaveRequest(id: string): Promise<void> {
  const docRef = doc(db, 'leaveRequests', id);
  await deleteDoc(docRef);
}
