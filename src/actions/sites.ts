'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Site } from '@/lib/types';

// Get all sites
export async function getSites(): Promise<Site[]> {
  const querySnapshot = await getDocs(collection(db, 'sites'));
  const sites: Site[] = [];
  querySnapshot.forEach((doc) => {
    sites.push({ id: doc.id, ...doc.data() } as Site);
  });
  return sites.sort((a, b) => a.name.localeCompare(b.name));
}

// Get a single site by ID
export async function getSite(id: string): Promise<Site | null> {
  const docRef = doc(db, 'sites', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Site;
  } else {
    return null;
  }
}

// Create a new site
export async function createSite(site: Omit<Site, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'sites'), site);
  return docRef.id;
}

// Update an existing site
export async function updateSite(id: string, site: Partial<Site>): Promise<void> {
  const docRef = doc(db, 'sites', id);
  await updateDoc(docRef, site);
}

// Delete a site
export async function deleteSite(id: string): Promise<void> {
  const docRef = doc(db, 'sites', id);
  await deleteDoc(docRef);
}
