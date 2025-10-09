
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import type { FuelRequest } from '@/lib/types';
import { createFinanceRecord } from '@/actions/finance';

export async function getAllFuelRequests(): Promise<FuelRequest[]> {
  try {
    const q = query(collection(db, 'fuelRequests'), orderBy('requestDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const requests: FuelRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        requestDate: (data.requestDate as Timestamp).toDate(),
        approvedDate: data.approvedDate ? (data.approvedDate as Timestamp).toDate() : undefined,
      } as FuelRequest);
    });
    return requests;
  } catch (error) {
    console.error("Error fetching all fuel requests:", error);
    return [];
  }
}

export async function updateFuelRequest(
  requestId: string,
  updates: Partial<FuelRequest>
): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, 'fuelRequests', requestId);
    await updateDoc(docRef, updates);

    // If approved, create finance record
    if (updates.status === 'Approved' && updates.approvedAmount) {
      await createFinanceRecord({
        projectId: 'OFFICE', // Or derive from vehicle/driver if possible
        projectName: 'Office Operational',
        type: 'expense',
        amount: updates.approvedAmount,
        description: `Pengisian BBM untuk ${updates.vehicleId} oleh ${updates.driverName}`,
        date: new Date(),
        category: 'BBM',
      });
    }

    return { success: true, message: 'Status pengajuan berhasil diperbarui.' };
  } catch (error) {
    console.error("Error updating fuel request:", error);
    return { success: false, message: 'Gagal memperbarui status pengajuan.' };
  }
}
