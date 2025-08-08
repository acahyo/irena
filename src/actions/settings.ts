
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import type { AppSettings } from '@/lib/types';

const SETTINGS_ID = 'app-settings';

// Get application settings
export async function getSettings(): Promise<AppSettings> {
  const settingsCollection = collection(db, 'settings');
  const querySnapshot = await getDocs(settingsCollection);
  
  if (querySnapshot.empty) {
    // Default settings if none exist
    return {
      appName: 'Staff Hub',
      appDescription: 'An application for employee management.',
      logo: '',
      primaryColor: '#136F63',
      backgroundColor: '#D2E9E6',
      accentColor: '#877795',
    };
  }
  
  const settingsDoc = querySnapshot.docs.find(doc => doc.id === SETTINGS_ID);
  
  if (settingsDoc) {
    return { id: settingsDoc.id, ...settingsDoc.data() } as AppSettings;
  }
  
  // Fallback to default if 'app-settings' doc doesn't exist for some reason
  return {
      appName: 'Staff Hub',
      appDescription: 'An application for employee management.',
      logo: '',
      primaryColor: '#136F63',
      backgroundColor: '#D2E9E6',
      accentColor: '#877795',
  };
}

// Save application settings
export async function saveSettings(settings: Omit<AppSettings, 'id'>): Promise<void> {
  const settingsRef = doc(db, 'settings', SETTINGS_ID);
  // We use setDoc with a fixed ID to ensure there's only one settings document.
  await setDoc(settingsRef, settings);
}
