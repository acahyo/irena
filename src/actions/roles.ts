'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Role } from '@/lib/types';
import { roles as staticRoles } from '@/lib/data';

// Get all roles
export async function getRoles(): Promise<Role[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'roles'));
    if (querySnapshot.empty) {
      // If the collection is empty, pre-populate it with static data.
      const batch = writeBatch(db);
      staticRoles.forEach(role => {
        const docRef = doc(db, 'roles', role.id);
        batch.set(docRef, role);
      });
      await batch.commit();
      return staticRoles.sort((a, b) => a.name.localeCompare(b.name));
    }
    const roles: Role[] = [];
    querySnapshot.forEach((doc) => {
      roles.push({ id: doc.id, ...doc.data() } as Role);
    });
    return roles.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching roles, falling back to static data:", error);
    return staticRoles.sort((a, b) => a.name.localeCompare(b.name));
  }
}

// Get a single role by ID
export async function getRole(id: string): Promise<Role | null> {
  try {
    const docRef = doc(db, 'roles', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Role;
    } else {
      return staticRoles.find(r => r.id === id) || null;
    }
  } catch (error) {
    console.error(`Error fetching role ${id}, falling back to static data:`, error);
    return staticRoles.find(r => r.id === id) || null;
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

// Update multiple role permissions
export async function updateRolePermissions(updates: { roleId: string; accessibleMenus: string[] }[]): Promise<void> {
    const batch = writeBatch(db);
    updates.forEach(({ roleId, accessibleMenus }) => {
        const docRef = doc(db, 'roles', roleId);
        batch.update(docRef, { accessibleMenus });
    });
    await batch.commit();
}


// Delete a role
export async function deleteRole(id: string): Promise<void> {
  const docRef = doc(db, 'roles', id);
  await deleteDoc(docRef);
}
