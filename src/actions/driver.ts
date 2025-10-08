

'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { DriverAttendance, P2hReport, UnitConditionReport, FuelRequest } from '@/lib/types';


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

export async function submitDriverAttendance(attendanceData: Omit<DriverAttendance, 'photoUrl' | 'id'> & { photoDataUri: string }): Promise<{ success: boolean, message: string }> {
    try {
        const { driverId, driverName, photoDataUri } = attendanceData;
        const photoUrl = await uploadFileAndGetURL(photoDataUri, `driver-attendance/${driverId}/${Date.now()}.jpg`);
        
        const finalData: Omit<DriverAttendance, 'id'> = {
            ...attendanceData,
            photoUrl,
            timestamp: new Date(),
        };

        await addDoc(collection(db, 'driverAttendance'), finalData);

        return { success: true, message: 'Absensi berhasil direkam.' };
    } catch (error) {
        console.error("Error submitting driver attendance:", error);
        return { success: false, message: 'Gagal merekam absensi.' };
    }
}

export async function submitP2hReport(reportData: Omit<P2hReport, 'id' | 'timestamp' | 'photoUrl'> & { photoDataUri: string }): Promise<{ success: boolean, message: string }> {
    try {
        const { driverId, photoDataUri } = reportData;
        const photoUrl = await uploadFileAndGetURL(photoDataUri, `p2h-reports/${driverId}/${Date.now()}.jpg`);

        const finalData: Omit<P2hReport, 'id'> = {
            ...reportData,
            photoUrl,
            timestamp: new Date(),
        };
        await addDoc(collection(db, 'p2hReports'), finalData);
        return { success: true, message: 'Laporan P2H berhasil dikirim.' };
    } catch (error) {
        console.error("Error submitting P2H report:", error);
        return { success: false, message: 'Gagal mengirim laporan P2H.' };
    }
}

export async function submitUnitConditionReport(reportData: Omit<UnitConditionReport, 'id' | 'timestamp'>): Promise<{ success: boolean, message: string }> {
    try {
         const finalData: Omit<UnitConditionReport, 'id'> = {
            ...reportData,
            timestamp: new Date(),
        };
        await addDoc(collection(db, 'unitConditionReports'), finalData);
        return { success: true, message: 'Laporan kondisi unit berhasil dikirim.' };
    } catch (error) {
        console.error("Error submitting unit condition report:", error);
        return { success: false, message: 'Gagal mengirim laporan kondisi unit.' };
    }
}

export async function getDriverAttendanceHistory(driverId: string): Promise<DriverAttendance[]> {
    try {
        const q = query(collection(db, 'driverAttendance'), where('driverId', '==', driverId), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const history: DriverAttendance[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate(),
            } as DriverAttendance);
        });
        
        return history;

    } catch (error) {
        console.error("Error fetching driver attendance history:", error);
        return [];
    }
}

export async function getAllDriverAttendance(): Promise<DriverAttendance[]> {
  try {
    const q = query(collection(db, 'driverAttendance'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const history: DriverAttendance[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        timestamp: (data.timestamp as Timestamp).toDate(),
      } as DriverAttendance);
    });
    return history;
  } catch (error) {
    console.error("Error fetching all driver attendance:", error);
    return [];
  }
}

export async function getP2hReports(): Promise<P2hReport[]> {
  try {
    const q = query(collection(db, 'p2hReports'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const reports: P2hReport[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        timestamp: (data.timestamp as Timestamp).toDate(),
      } as P2hReport);
    });
    return reports;
  } catch (error) {
    console.error("Error fetching P2H reports:", error);
    return [];
  }
}

export async function getUnitConditionReports(): Promise<UnitConditionReport[]> {
  try {
    const q = query(collection(db, 'unitConditionReports'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const reports: UnitConditionReport[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        timestamp: (data.timestamp as Timestamp).toDate(),
      } as UnitConditionReport);
    });
    return reports;
  } catch (error) {
    console.error("Error fetching unit condition reports:", error);
    return [];
  }
}

// Fuel Requests
export async function createFuelRequest(requestData: Omit<FuelRequest, 'id' | 'requestDate' | 'status'>): Promise<{ success: boolean; message: string; newRequest?: FuelRequest; }> {
    try {
        const finalData = {
            ...requestData,
            requestDate: new Date(),
            status: 'Pending',
        };
        const docRef = await addDoc(collection(db, 'fuelRequests'), finalData);
        
        const newRequest: FuelRequest = {
            id: docRef.id,
            ...finalData,
        }

        return { success: true, message: 'Pengajuan BBM berhasil dikirim.', newRequest };
    } catch (error) {
        console.error("Error submitting fuel request:", error);
        return { success: false, message: 'Gagal mengirim pengajuan BBM.' };
    }
}

export async function getFuelRequestsByDriver(driverId: string): Promise<FuelRequest[]> {
    try {
        const q = query(collection(db, 'fuelRequests'), where('driverId', '==', driverId), orderBy('requestDate', 'desc'));
        const querySnapshot = await getDocs(q);
        const requests: FuelRequest[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            requests.push({
                id: doc.id,
                ...data,
                requestDate: (data.requestDate as Timestamp).toDate(),
            } as FuelRequest);
        });
        return requests;
    } catch (error) {
        console.error("Error fetching fuel requests for driver:", error);
        return [];
    }
}
