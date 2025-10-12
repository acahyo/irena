
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import type { Candidate } from '@/lib/types';


// Get all candidates
export async function getCandidates(): Promise<Candidate[]> {
  try {
    const q = query(collection(db, 'candidates'), orderBy('appliedDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const candidates: Candidate[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      candidates.push({
        id: doc.id,
        ...data,
        appliedDate: (data.appliedDate as Timestamp).toDate(),
      } as Candidate);
    });
    return candidates;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return [];
  }
}

// Create a new candidate
export async function createCandidate(data: Omit<Candidate, 'id' | 'appliedDate' | 'status'>): Promise<string> {
  const finalData = {
    ...data,
    appliedDate: serverTimestamp(),
    status: 'Pending' as const,
  };
  const docRef = await addDoc(collection(db, 'candidates'), finalData);
  return docRef.id;
}

// Update an existing candidate
export async function updateCandidate(id: string, updates: Partial<Omit<Candidate, 'id' | 'appliedDate'>>): Promise<void> {
  const docRef = doc(db, 'candidates', id);
  await updateDoc(docRef, updates);
}

// Delete a candidate
export async function deleteCandidate(id: string): Promise<void> {
  const docRef = doc(db, 'candidates', id);
  await deleteDoc(docRef);
}
