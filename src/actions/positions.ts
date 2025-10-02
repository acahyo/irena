'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Position, Allowance } from '@/lib/types';
import { positions as staticPositions } from '@/lib/data';

// Helper to convert form data to a structured Position object
const processFormData = (data: any) => {
    const positionData: Partial<Position> = {
        name: data.name,
        salaryType: data.salaryType,
        projectName: data.projectName,
    };

    if (data.salaryType === 'harian') {
        positionData.dailyWage = Number(data.dailyWage) || 0;
        positionData.overtimeRate = Number(data.overtimeRate) || 0;
    } else if (data.salaryType === 'bulanan' || data.salaryType === 'direksi') {
        positionData.monthlySalary = Number(data.monthlySalary) || 0;
    }
    
    const allowances: Allowance[] = [];
    Object.keys(data).forEach(key => {
        if (key.startsWith('allowanceName-')) {
            const index = key.split('-')[1];
            const name = data[key];
            const amount = Number(data[`allowanceAmount-${index}`]);
            if (name && amount > 0) {
                allowances.push({ name, amount });
            }
        }
    });

    if (allowances.length > 0) {
        positionData.allowances = allowances;
    }

    return positionData;
};


// Get all positions
export async function getPositions(): Promise<Position[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'positions'));
     if (querySnapshot.empty) {
      return staticPositions;
    }
    const positions: Position[] = [];
    querySnapshot.forEach((doc) => {
      positions.push({ id: doc.id, ...doc.data() } as Position);
    });
    return positions.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching positions, falling back to static data:", error);
    return staticPositions;
  }
}

// Get a single position by ID
export async function getPosition(id: string): Promise<Position | null> {
  try {
    const docRef = doc(db, 'positions', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Position;
    } else {
      return staticPositions.find(p => p.id === id) || null;
    }
  } catch (error) {
    console.error(`Error fetching position ${id}, falling back to static data:`, error);
    return staticPositions.find(p => p.id === id) || null;
  }
}

// Create a new position
export async function createPosition(data: { [k: string]: FormDataEntryValue }): Promise<string> {
  const position = processFormData(data);
  const docRef = await addDoc(collection(db, 'positions'), position);
  return docRef.id;
}

// Update an existing position
export async function updatePosition(id: string, data: { [k: string]: FormDataEntryValue }): Promise<void> {
  const position = processFormData(data);
  const docRef = doc(db, 'positions', id);
  await updateDoc(docRef, position);
}

// Delete a position
export async function deletePosition(id: string): Promise<void> {
  const docRef = doc(db, 'positions', id);
  await deleteDoc(docRef);
}
