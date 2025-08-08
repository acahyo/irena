
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import type { AppSettings } from '@/lib/types';

const SETTINGS_ID = 'app-settings';

// Get application settings
export async function getSettings(): Promise<AppSettings> {
  const settingsRef = doc(db, 'settings', SETTINGS_ID);
  const settingsCollection = collection(db, 'settings');
  const querySnapshot = await getDocs(settingsCollection);
  
  if (querySnapshot.empty) {
    // Default settings if none exist
    return {
      appName: 'Staff Hub',
      appDescription: 'An application for employee management.',
      logo: '',
      primaryColor: '#1A5D1A',
      backgroundColor: '#E1F0DA',
      accentColor: '#6B7280',
    };
  }
  
  const settingsDoc = querySnapshot.docs[0];
  return { id: settingsDoc.id, ...settingsDoc.data() } as AppSettings;
}

// Save application settings
export async function saveSettings(settings: AppSettings): Promise<void> {
  const settingsRef = doc(db, 'settings', SETTINGS_ID);
  // We use setDoc with a fixed ID to ensure there's only one settings document.
  await setDoc(settingsRef, settings);
}
