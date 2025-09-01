
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Position } from '@/lib/types';

// Helper to convert string numbers to actual numbers for Firestore
const toNumeric = (obj: any) => {
    const numericFields: (keyof Position)[] = [
        'dailyWage', 'overtimeRate', 'monthlySalary', 'otAllowance', 
        'locationAllowance', 'mealAllowance', 'otherAllowances',
        'tunjanganJabatan', 'tunjanganKehadiran', 'tunjanganKinerja'
    ];
    const newObj = { ...obj };
    numericFields.forEach(field => {
        if (newObj[field] && typeof newObj[field] === 'string') {
            newObj[field] = Number(newObj[field]);
        } else if (newObj[field] === '') {
            newObj[field] = null;
        }
    });
    return newObj;
};


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
  const numericPosition = toNumeric(position);
  const docRef = await addDoc(collection(db, 'positions'), numericPosition);
  return docRef.id;
}

// Update an existing position
export async function updatePosition(id: string, position: Partial<Position>): Promise<void> {
  const numericPosition = toNumeric(position);
  const docRef = doc(db, 'positions', id);
  await updateDoc(docRef, numericPosition);
}

// Delete a position
export async function deletePosition(id: string): Promise<void> {
  const docRef = doc(db, 'positions', id);
  await deleteDoc(docRef);
}
