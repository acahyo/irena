
'use server';

import { db, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import type { Candidate } from '@/lib/types';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

async function uploadFileAndGetURL(base64Data: string, path: string): Promise<{ downloadURL: string; fileName: string; }> {
  if (!base64Data || !base64Data.startsWith('data:')) {
    throw new Error('Invalid file data provided.');
  }

  const mimeTypeMatch = base64Data.match(/data:(.*);base64,/);
  if (!mimeTypeMatch) throw new Error('Invalid data URI format.');
  const mimeType = mimeTypeMatch[1];
  const extension = mimeType.split('/')[1] || 'bin';
  
  const fileName = `${path.split('/').pop()}-${Date.now()}.${extension}`;
  const storageRef = ref(storage, `candidate-docs/${fileName}`);
  const uploadResult = await uploadString(storageRef, base64Data, 'data_url');
  const downloadURL = await getDownloadURL(uploadResult.ref);
  return { downloadURL, fileName };
}


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
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
      } as Candidate);
    });
    return candidates;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return [];
  }
}

// Get a single candidate by ID (NIK)
export async function getCandidateById(id: string): Promise<Candidate | null> {
    try {
        const docRef = doc(db, 'candidates', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return { 
                id: docSnap.id, 
                ...data,
                appliedDate: (data.appliedDate as Timestamp).toDate(),
                dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
            } as Candidate;
        }
        return null;
    } catch (error) {
        console.error("Error fetching candidate by ID:", error);
        return null;
    }
}

// Create a new candidate using NIK as document ID
export async function createCandidate(data: Omit<Candidate, 'id' | 'appliedDate' | 'status'>): Promise<string> {
  if (!data.nik) {
    throw new Error('NIK is required to create a candidate.');
  }
  const candidateId = data.nik;

  const finalData: { [key: string]: any } = {
    ...data,
    appliedDate: serverTimestamp(),
    status: 'Pending' as const,
  };
  
  if (data.dateOfBirth) {
    finalData.dateOfBirth = new Date(data.dateOfBirth);
  }

  const docRef = doc(db, 'candidates', candidateId);
  await setDoc(docRef, finalData);

  return candidateId;
}


// Update an existing candidate
export async function updateCandidate(id: string, updates: Partial<Omit<Candidate, 'id' | 'appliedDate'>>): Promise<void> {
  const docRef = doc(db, 'candidates', id);
  const updateData: { [key: string]: any } = { ...updates };
  
  if (updateData.dateOfBirth) {
    updateData.dateOfBirth = new Date(updateData.dateOfBirth);
  }

  if (updateData.interviewDocUrl && (updateData.interviewDocUrl as string).startsWith('data:')) {
    const { downloadURL, fileName } = await uploadFileAndGetURL(updateData.interviewDocUrl, `interview-${id}`);
    updateData.interviewDocUrl = downloadURL;
    updateData.interviewDocName = fileName;
  }
  
  if (updateData.testDocUrl && (updateData.testDocUrl as string).startsWith('data:')) {
    const { downloadURL, fileName } = await uploadFileAndGetURL(updateData.testDocUrl, `test-${id}`);
    updateData.testDocUrl = downloadURL;
    updateData.testDocName = fileName;
  }
  
  await updateDoc(docRef, updateData);
}

// Delete a candidate
export async function deleteCandidate(id: string): Promise<void> {
  const docRef = doc(db, 'candidates', id);
  await deleteDoc(docRef);
}
