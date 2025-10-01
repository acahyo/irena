'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import type { Vehicle } from '@/lib/types';

// Get all vehicles
export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const q = query(collection(db, 'vehicles'), orderBy('fleetNumber'));
    const querySnapshot = await getDocs(q);
    const vehicles: Vehicle[] = [];
    querySnapshot.forEach((doc) => {
      vehicles.push({ id: doc.id, ...doc.data() } as Vehicle);
    });
    return vehicles;
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
}

// Create a new vehicle
export async function createVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'vehicles'), vehicle);
  return docRef.id;
}

// Update an existing vehicle
export async function updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<void> {
  const docRef = doc(db, 'vehicles', id);
  await updateDoc(docRef, vehicle);
}

// Delete a vehicle
export async function deleteVehicle(id: string): Promise<void> {
  const docRef = doc(db, 'vehicles', id);
  await deleteDoc(docRef);
}
