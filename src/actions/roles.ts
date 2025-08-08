
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Role } from '@/lib/types';

// Get all roles
export async function getRoles(): Promise<Role[]> {
  const querySnapshot = await getDocs(collection(db, 'roles'));
  const roles: Role[] = [];
  querySnapshot.forEach((doc) => {
    roles.push({ id: doc.id, ...doc.data() } as Role);
  });
  return roles.sort((a, b) => a.name.localeCompare(b.name));
}

// Get a single role by ID
export async function getRole(id: string): Promise<Role | null> {
  const docRef = doc(db, 'roles', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Role;
  } else {
    return null;
  }
}

// Create a new role
export async function createRole(role: Omit<Role, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'roles'), role);
  return docRef.id;
}

// Update an existing role
export async function updateRole(id: string, role: Partial<Role>): Promise<void> {
  const docRef = doc(db, 'roles', id);
  await updateDoc(docRef, role);
}

// Delete a role
export async function deleteRole(id: string): Promise<void> {
  const docRef = doc(db, 'roles', id);
  await deleteDoc(docRef);
}
