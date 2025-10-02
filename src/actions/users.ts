
'use server';

import { createHash } from 'crypto';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { users as staticUsers } from '@/lib/data';

// Get all users
export async function getUsers(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    if (querySnapshot.empty) {
      return staticUsers;
    }
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure password is not sent to the client
      delete data.password;
      users.push({ id: doc.id, ...data } as User);
    });
    return users.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching users, falling back to static data:", error);
    return staticUsers;
  }
}

// Get a single user by ID
export async function getUser(id: string): Promise<User | null> {
  try {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure password is not sent to the client
      // We keep it on the object for session checks but delete for client fetching.
      // A better approach would be separate server/client types.
      // delete data.password; 
      return { id: docSnap.id, ...data } as User;
    } else {
      const staticUser = staticUsers.find(u => u.id === id) || null;
      if (staticUser) {
        const { password, ...rest } = staticUser;
        return rest as User;
      }
      return null;
    }
  } catch (error) {
    console.error(`Error fetching user ${id}, falling back to static data:`, error);
    const staticUser = staticUsers.find(u => u.id === id) || null;
      if (staticUser) {
        const { password, ...rest } = staticUser;
        return rest as User;
      }
      return null;
  }
}

// Create a new user
export async function createUser(user: Omit<User, 'id'>): Promise<string> {
    if (user.password) {
        user.password = createHash('md5').update(user.password).digest('hex');
    }

    const userData: any = { ...user };
    if (typeof user.siteIds === 'string') {
        userData.siteIds = (user.siteIds as string).split(',').map(id => id.trim()).filter(Boolean);
    }

    const docRef = await addDoc(collection(db, 'users'), userData);
    return docRef.id;
}

// Update an existing user
export async function updateUser(id: string, user: Partial<User>): Promise<void> {
  const docRef = doc(db, 'users', id);
  const userData: { [key: string]: any } = { ...user };
  
  // Hash password only if it's being changed (i.e., it's not empty)
  if (userData.password) {
      userData.password = createHash('md5').update(userData.password).digest('hex');
  } else {
      // Avoid overwriting the existing password with an empty one
      delete userData.password;
  }
  
  if (typeof user.siteIds === 'string') {
    userData.siteIds = (user.siteIds as string).split(',').map(id => id.trim()).filter(Boolean);
  } else if (Array.isArray(user.siteIds)) {
    userData.siteIds = user.siteIds;
  }

  if (userData.role !== 'Admin Proyek') {
    userData.siteIds = null;
  }
  if (userData.role !== 'Admin Absensi') {
    userData.positionName = null;
  }

  await updateDoc(docRef, userData);
}

// Delete a user
export async function deleteUser(id: string): Promise<void> {
  const docRef = doc(db, 'users', id);
  await deleteDoc(docRef);
}
