'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Site } from '@/lib/types';
import { sites as staticSites } from '@/lib/data';

// Get all sites
export async function getSites(): Promise<Site[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'sites'));
    if(querySnapshot.empty) {
      return staticSites;
    }
    const sites: Site[] = [];
    querySnapshot.forEach((doc) => {
      sites.push({ id: doc.id, ...doc.data() } as Site);
    });
    return sites.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching sites, falling back to static data:", error);
    return staticSites;
  }
}

// Get a single site by ID
export async function getSite(id: string): Promise<Site | null> {
  try {
    const docRef = doc(db, 'sites', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Site;
    } else {
      return staticSites.find(s => s.id === id) || null;
    }
  } catch (error) {
     console.error(`Error fetching site ${id}, falling back to static data:`, error);
    return staticSites.find(s => s.id === id) || null;
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
