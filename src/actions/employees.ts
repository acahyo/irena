
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Employee } from '@/lib/types';

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


// Get all employees
export async function getEmployees(): Promise<Employee[]> {
  const querySnapshot = await getDocs(collection(db, 'employees'));
  const employees: Employee[] = [];
  querySnapshot.forEach((doc) => {
    const data = convertTimestampsToDates(doc.data());
    employees.push({ id: doc.id, ...data } as Employee);
  });
  return employees;
}

// Get a single employee by ID
export async function getEmployee(id: string): Promise<Employee | null> {
  const docRef = doc(db, 'employees', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertTimestampsToDates(docSnap.data()) } as Employee;
  } else {
    return null;
  }
}

// Create a new employee
export async function createEmployee(employee: Partial<Employee>): Promise<string> {
  const docRef = await addDoc(collection(db, 'employees'), employee);
  return docRef.id;
}

// Update an existing employee
export async function updateEmployee(id: string, employee: Partial<Employee>): Promise<void> {
  const docRef = doc(db, 'employees', id);
  await updateDoc(docRef, employee);
}

// Delete an employee
export async function deleteEmployee(id: string): Promise<void> {
  const docRef = doc(db, 'employees', id);
  await deleteDoc(docRef);
}
