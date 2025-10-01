'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { PjAttendance } from '@/lib/types';

// Helper to upload base64 file to Firebase Storage and get URL
async function uploadFileAndGetURL(base64Data: string, path: string): Promise<string> {
    if (!base64Data || !base64Data.startsWith('data:')) {
        throw new Error('Invalid file data provided.');
    }
    
    const storageRef = ref(storage, path);
    const uploadResult = await uploadString(storageRef, base64Data, 'data_url');
    const downloadURL = await getDownloadURL(uploadResult.ref);
    return downloadURL;
}

export async function submitPjAttendance(attendanceData: Omit<PjAttendance, 'photoUrl' | 'id'> & { photoDataUri?: string }): Promise<{ success: boolean, message: string }> {
    try {
        const { pjId, photoDataUri, ...rest } = attendanceData;
        let photoUrl: string | undefined = undefined;

        if (photoDataUri) {
            photoUrl = await uploadFileAndGetURL(photoDataUri, `pj-attendance/${pjId}/${Date.now()}.jpg`);
        }
        
        const finalData: Omit<PjAttendance, 'id'> = {
            ...rest,
            pjId,
            photoUrl,
            timestamp: new Date(),
        };

        await addDoc(collection(db, 'pjAttendance'), finalData);

        return { success: true, message: 'Absensi berhasil direkam.' };
    } catch (error) {
        console.error("Error submitting PJ attendance:", error);
        return { success: false, message: 'Gagal merekam absensi.' };
    }
}


export async function getPjAttendanceHistory(pjId: string): Promise<PjAttendance[]> {
    try {
        const q = query(collection(db, 'pjAttendance'), where('pjId', '==', pjId));
        const querySnapshot = await getDocs(q);
        const history: PjAttendance[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate(),
            } as PjAttendance);
        });
        
        return history.sort((a, b) => (b.timestamp as any) - (a.timestamp as any));

    } catch (error) {
        console.error("Error fetching PJ attendance history:", error);
        return [];
    }
}


export async function getAllPjAttendance(): Promise<PjAttendance[]> {
  try {
    const q = query(collection(db, 'pjAttendance'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const history: PjAttendance[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        timestamp: (data.timestamp as Timestamp).toDate(),
      } as PjAttendance);
    });
    return history;
  } catch (error) {
    console.error("Error fetching all PJ attendance:", error);
    return [];
  }
}