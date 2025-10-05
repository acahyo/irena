

'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import type { AppSettings } from '@/lib/types';

const SETTINGS_ID = 'app-settings';

// Get application settings
export async function getSettings(): Promise<AppSettings> {
  const settingsCollection = collection(db, 'settings');
  const querySnapshot = await getDocs(settingsCollection);
  
  const defaultSettings: AppSettings = {
      appName: 'Staff Hub',
      appDescription: 'An application for employee management.',
      logo: 'https://drive.google.com/file/d/1ggYVy0-UgoXuQvB96yIdDQm8M4pr7iZt/view?usp=sharing',
      favicon: 'https://drive.google.com/file/d/1ggYVy0-UgoXuQvB96yIdDQm8M4pr7iZt/view?usp=sharing',
      primaryColor: '#136F63',
      backgroundColor: '#D2E9E6',
      accentColor: '#877795',
      language: 'id',
      employeePayslipAccess: true,
  };
  
  if (querySnapshot.empty) {
    // Default settings if none exist
    return defaultSettings;
  }
  
  const settingsDoc = querySnapshot.docs.find(doc => doc.id === SETTINGS_ID);
  
  if (settingsDoc) {
    const data = settingsDoc.data();
    // Return saved settings, falling back to defaults for any missing properties
    return { ...defaultSettings, id: settingsDoc.id, ...data } as AppSettings;
  }
  
  // Fallback to default if 'app-settings' doc doesn't exist for some reason
  return defaultSettings;
}

// Save application settings
export async function saveSettings(settings: Omit<AppSettings, 'id'>): Promise<void> {
  const settingsRef = doc(db, 'settings', SETTINGS_ID);
  // We use setDoc with a fixed ID to ensure there's only one settings document.
  // The id property must be removed before saving.
  const { id, ...settingsData } = settings as AppSettings;
  await setDoc(settingsRef, settingsData);
}
