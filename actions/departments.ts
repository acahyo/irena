'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Department } from '@/lib/types';
import { departments as staticDepartments } from '@/lib/data';

// Get all departments
export async function getDepartments(): Promise<Department[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'departments'));
    if (querySnapshot.empty) {
      // If the collection is empty, return static data.
      return staticDepartments;
    }
    const departments: Department[] = [];
    querySnapshot.forEach((doc) => {
      departments.push({ id: doc.id, ...doc.data() } as Department);
    });
    return departments.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching departments, falling back to static data:", error);
    // If there's an error (like permission denied), fall back to static data.
    return staticDepartments;
  }
}

// Get a single department by ID
export async function getDepartment(id: string): Promise<Department | null> {
  try {
    const docRef = doc(db, 'departments', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Department;
    } else {
      // Fallback for when data is not in DB but might be in static data
      return staticDepartments.find(d => d.id === id) || null;
    }
  } catch (error) {
    console.error(`Error fetching department ${id}, falling back to static data:`, error);
    return staticDepartments.find(d => d.id === id) || null;
  }
}

// Create a new department
export async function createDepartment(department: Omit<Department, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'departments'), department);
  return docRef.id;
}

// Update an existing department
export async function updateDepartment(id: string, department: Partial<Department>): Promise<void> {
  const docRef = doc(db, 'departments', id);
  await updateDoc(docRef, department);
}

// Delete a department
export async function deleteDepartment(id: string): Promise<void> {
  const docRef = doc(db, 'departments', id);
  await deleteDoc(docRef);
}
