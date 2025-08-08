
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Position } from '@/lib/types';

// Get all positions
export async function getPositions(): Promise<Position[]> {
  const querySnapshot = await getDocs(collection(db, 'positions'));
  const positions: Position[] = [];
  querySnapshot.forEach((doc) => {
    positions.push({ id: doc.id, ...doc.data() } as Position);
  });
  return positions.sort((a, b) => a.name.localeCompare(b.name));
}

// Get a single position by ID
export async function getPosition(id: string): Promise<Position | null> {
  const docRef = doc(db, 'positions', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Position;
  } else {
    return null;
  }
}

// Create a new position
export async function createPosition(position: Omit<Position, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'positions'), position);
  return docRef.id;
}

// Update an existing position
export async function updatePosition(id: string, position: Partial<Position>): Promise<void> {
  const docRef = doc(db, 'positions', id);
  await updateDoc(docRef, position);
}

// Delete a position
export async function deletePosition(id: string): Promise<void> {
  const docRef = doc(db, 'positions', id);
  await deleteDoc(docRef);
}
