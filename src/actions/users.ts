
'use server';

import { createHash } from 'crypto';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

// Get all users
export async function getUsers(): Promise<User[]> {
  const querySnapshot = await getDocs(collection(db, 'users'));
  const users: User[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Ensure password is not sent to the client
    delete data.password;
    users.push({ id: doc.id, ...data } as User);
  });
  return users.sort((a, b) => a.name.localeCompare(b.name));
}

// Get a single user by ID
export async function getUser(id: string): Promise<User | null> {
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    // Ensure password is not sent to the client
    delete data.password;
    return { id: docSnap.id, ...data } as User;
  } else {
    return null;
  }
}

// Create a new user
export async function createUser(user: Omit<User, 'id'>): Promise<string> {
    if (user.password) {
        user.password = createHash('md5').update(user.password).digest('hex');
    }
  const docRef = await addDoc(collection(db, 'users'), user);
  return docRef.id;
}

// Update an existing user
export async function updateUser(id: string, user: Partial<User>): Promise<void> {
  const docRef = doc(db, 'users', id);
  const userData = { ...user };
  // Hash password only if it's being changed (i.e., it's not empty)
  if (userData.password) {
      userData.password = createHash('md5').update(userData.password).digest('hex');
  } else {
      // Avoid overwriting the existing password with an empty one
      delete userData.password;
  }
  await updateDoc(docRef, userData);
}

// Delete a user
export async function deleteUser(id: string): Promise<void> {
  const docRef = doc(db, 'users', id);
  await deleteDoc(docRef);
}
