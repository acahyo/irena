

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
  writeBatch,
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

    // This function is now specifically for SOLAR fuel type that checks warehouse
    if (request.fuelType !== 'Solar') {
        return { success: false, message: 'This function is only for Solar. Use forwardToFinance for other types.' };
    }

    // For Solar, check warehouse stock
    const warehouseItems = await getWarehouseItems();
    const solarItem = warehouseItems.find(item => item.name.toLowerCase() === 'bbm solar');
    
    if (solarItem && solarItem.stock >= request.liters) {
        // Stock is available, approve from stock
        const batch = writeBatch(db);
        batch.update(doc(db, 'warehouseItems', solarItem.id), { stock: solarItem.stock - request.liters });
        batch.update(docRef, { ...requestUpdates, status: 'Approved by Purchasing', isFromStock: true });
        await batch.commit();

        return { success: true, message: `Disetujui dari stok gudang. Stok BBM Solar diperbarui.` };
    } else {
        // Stock not available, forward to finance
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

// New specific function to forward non-solar requests to finance
export async function forwardFuelRequestToFinance(
  request: FuelRequest,
  updates: Partial<Pick<FuelRequest, 'approvedAmount'>> & { processorId: string; processorName: string }
): Promise<{ success: boolean; message: string }> {
     try {
        const { processorId, processorName, approvedAmount } = updates;
        
        if (!approvedAmount || approvedAmount <= 0) {
            return { success: false, message: 'Nominal dana yang diajukan wajib diisi.' };
        }

        const paymentResult = await createPaymentRequest({
            requesterId: processorId,
            requesterName: processorName,
            category: 'Pengadaan Barang',
            paymentName: `Pengajuan BBM: ${request.liters}L ${request.fuelType} untuk ${request.vehicleId}`,
            amount: approvedAmount,
        });

        if (paymentResult.success && paymentResult.newRequest) {
            const docRef = doc(db, 'fuelRequests', request.id);
            await updateDoc(docRef, { 
                approvedAmount,
                status: 'Forwarded to Finance',
                paymentRequestId: paymentResult.newRequest.id,
                approvedById: processorId,
                approvedByName: processorName,
                approvedDate: new Date(),
            });
            return { success: true, message: 'Pengajuan berhasil diteruskan ke Finance.' };
        } else {
            return { success: false, message: paymentResult.message || 'Gagal membuat pengajuan pembayaran.' };
        }

    } catch (error) {
        console.error("Error forwarding fuel request to finance:", error);
        return { success: false, message: 'Gagal meneruskan pengajuan ke finance.' };
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
