
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

// Get all users
export async function getUsers(): Promise<User[]> {
  const querySnapshot = await getDocs(collection(db, 'users'));
  const users: User[] = [];
  querySnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() } as User);
  });
  return users.sort((a, b) => a.name.localeCompare(b.name));
}

// Get a single user by ID
export async function getUser(id: string): Promise<User | null> {
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as User;
  } else {
    return null;
  }
}

// Create a new user
export async function createUser(user: Omit<User, 'id'>): Promise<string> {
  // In a real app, you would hash the password here before saving
  const docRef = await addDoc(collection(db, 'users'), user);
  return docRef.id;
}

// Update an existing user
export async function updateUser(id: string, user: Partial<User>): Promise<void> {
  // In a real app, you would handle password changes separately and hash new passwords
  const docRef = doc(db, 'users', id);
  await updateDoc(docRef, user);
}

// Delete a user
export async function deleteUser(id: string): Promise<void> {
  const docRef = doc(db, 'users', id);
  await deleteDoc(docRef);
}
