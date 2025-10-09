

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
import type { FuelRequest, WarehouseItem, PaymentRequest } from '@/lib/types';
import { createPaymentRequest } from './payment-requests';
import { getWarehouseItems, updateWarehouseItemStock } from './warehouse';

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

export async function processFuelRequest(
  request: FuelRequest,
  updates: Partial<FuelRequest> & { processorId: string; processorName: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const { processorId, processorName, ...requestUpdates } = updates;
    const docRef = doc(db, 'fuelRequests', request.id);
    
    // For non-solar, forward to finance
    if (request.fuelType !== 'Solar') {
        if (!requestUpdates.approvedAmount || requestUpdates.approvedAmount <= 0) {
            return { success: false, message: 'Nominal dana yang diajukan wajib diisi.' };
        }
        
        const paymentResult = await createPaymentRequest({
            requesterId: processorId,
            requesterName: processorName,
            category: 'Pengadaan Barang',
            paymentName: `Pengajuan BBM: ${request.liters}L ${request.fuelType} untuk ${request.vehicleId}`,
            amount: requestUpdates.approvedAmount,
        });

        if (paymentResult.success && paymentResult.newRequest) {
            await updateDoc(docRef, { 
                ...requestUpdates,
                status: 'Forwarded to Finance',
                paymentRequestId: paymentResult.newRequest.id
            });
            return { success: true, message: 'Pengajuan berhasil diteruskan ke Finance.' };
        } else {
            return { success: false, message: paymentResult.message || 'Gagal membuat pengajuan pembayaran.' };
        }
    }

    // For Solar, check warehouse stock
    const warehouseItems = await getWarehouseItems();
    const solarItem = warehouseItems.find(item => item.name.toLowerCase() === 'bbm solar');
    
    if (solarItem && solarItem.stock >= request.liters) {
        // Stock is available, approve from stock
        await updateWarehouseItemStock(solarItem.id, solarItem.stock - request.liters);
        await updateDoc(docRef, { ...requestUpdates, status: 'Approved by Purchasing', isFromStock: true });
        return { success: true, message: `Disetujui dari stok gudang. Stok BBM Solar diperbarui.` };
    } else {
        // Stock not available, forward to finance
        // For Solar without stock, Purchasing must also input an amount.
        if (!requestUpdates.approvedAmount || requestUpdates.approvedAmount <= 0) {
            return { success: false, message: 'Stok tidak cukup. Nominal dana untuk Finance wajib diisi.' };
        }

        const paymentResult = await createPaymentRequest({
            requesterId: processorId,
            requesterName: processorName,
            category: 'Pengadaan Barang',
            paymentName: `Pengajuan BBM: ${request.liters}L Solar untuk ${request.vehicleId}`,
            amount: requestUpdates.approvedAmount,
        });
        
        if (paymentResult.success && paymentResult.newRequest) {
             await updateDoc(docRef, { 
                ...requestUpdates,
                status: 'Forwarded to Finance',
                paymentRequestId: paymentResult.newRequest.id,
                isFromStock: false
            });
             return { success: true, message: 'Stok tidak mencukupi, pengajuan diteruskan ke Finance.' };
        } else {
            return { success: false, message: paymentResult.message || 'Gagal membuat pengajuan pembayaran.' };
        }
    }
  } catch (error) {
    console.error("Error processing fuel request:", error);
    return { success: false, message: 'Gagal memproses pengajuan.' };
  }
}


export async function updateFuelRequestStatus(
  requestId: string,
  updates: Partial<FuelRequest>
): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, 'fuelRequests', requestId);
    await updateDoc(docRef, updates);
    
    return { success: true, message: 'Status pengajuan berhasil diperbarui.' };
  } catch (error) {
    console.error("Error updating fuel request status:", error);
    return { success: false, message: 'Gagal memperbarui status pengajuan.' };
  }
}
