

'use server';

import { db, storage } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp, writeBatch, setDoc, query, where, documentId } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { Employee } from '@/lib/types';
import { format } from 'date-fns';
import { createHash } from 'crypto';
import { getSitesByIds } from './sites';


// Helper to convert Firestore Timestamps to Dates in a document
function convertTimestampsToDates(docData: any) {
    if (!docData) return docData;
    const data = { ...docData };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
        }
    }
    return data;
}

// Helper to upload base64 file to Firebase Storage and get URL
async function uploadFileAndGetURL(base64Data: string, employeeId: string, fieldName: string): Promise<string> {
    if (!base64Data || !base64Data.startsWith('data:')) {
        // If it's already a URL (from a previous upload), just return it
        if (base64Data && (base64Data.startsWith('http') || base64Data.startsWith('https'))) {
            return base64Data;
        }
        throw new Error('Invalid file data provided.');
    }
    
    const mimeType = base64Data.substring(base64Data.indexOf(':') + 1, base64Data.indexOf(';'));
    const isImage = mimeType.startsWith('image/');
    const folder = isImage ? 'images' : 'documents';

    const storageRef = ref(storage, `${folder}/${employeeId}/${fieldName}-${Date.now()}`);
    const uploadResult = await uploadString(storageRef, base64Data, 'data_url');
    const downloadURL = await getDownloadURL(uploadResult.ref);
    return downloadURL;
}


// Get all employees
export async function getEmployees({ siteId, siteIds, shiftName }: { siteId?: string, siteIds?: string[], shiftName?: string } = {}): Promise<Employee[]> {
  try {
    const employeesRef = collection(db, 'employees');
    let conditions: any[] = [];
    
    // Handle single siteId
    if (siteId) {
        const siteDoc = await getDoc(doc(db, 'sites', siteId));
        if (siteDoc.exists()) {
            const siteName = siteDoc.data().name;
            conditions.push(where('siteLocation', '==', siteName));
        } else {
            return [];
        }
    } 
    // Handle multiple siteIds for Admin Proyek
    else if (siteIds && siteIds.length > 0) {
        const sites = await getSitesByIds(siteIds);
        if (sites.length > 0) {
            const siteNames = sites.map(s => s.name);
            conditions.push(where('siteLocation', 'in', siteNames));
        } else {
            return [];
        }
    }
    
    if (shiftName) {
        conditions.push(where('shift', '==', shiftName));
    }

    const q = conditions.length > 0 ? query(employeesRef, ...conditions) : query(employeesRef);
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return [];
    }
    const employees: Employee[] = [];
    querySnapshot.forEach((doc) => {
        const data = convertTimestampsToDates(doc.data());
        // Ensure password is not sent to the client
        delete data.password;
        employees.push({ id: doc.id, ...data } as Employee);
    });
    return employees;
  } catch (error) {
      console.error("Error fetching employees, returning empty array:", error);
      return [];
  }
}

// Get a single employee by ID
export async function getEmployee(id: string): Promise<Employee | null> {
  try {
    const docRef = doc(db, 'employees', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = convertTimestampsToDates(docSnap.data());
        // Ensure password is not sent to the client
        delete data.password;
        return { id: docSnap.id, ...data } as Employee;
    } else {
        return null;
    }
  } catch (error) {
      console.error(`Error fetching employee ${id}, returning null:`, error);
      return null;
  }
}

// Create a new employee
export async function createEmployee(employee: Partial<Employee>, actorRole?: string): Promise<string> {
    // Convert numeric fields from string to number
    const numericFields: (keyof Employee)[] = [
        'basicSalary', 'mealAllowance', 'transportAllowance', 'dailyWage', 'overtimeRate',
        'monthlySalary', 'otAllowance', 'locationAllowance', 'otherAllowances'
    ];
    const employeeData: { [key: string]: any } = { ...employee };

    numericFields.forEach(field => {
        if (employeeData[field] && typeof employeeData[field] === 'string') {
            employeeData[field] = Number(employeeData[field]);
        }
    });

    // Handle boolean for canGeneratePayslip
    employeeData.canGeneratePayslip = employee.canGeneratePayslip === true || (employee as any).canGeneratePayslip === 'on';

    
    // Use NIK as the employeeId
    const employeeId = employee.nik;
    if (!employeeId) {
        throw new Error("NIK is required to create an employee.");
    }
    
    // Handle positions
    if (typeof employee.positions === 'string') {
      employeeData.positions = (employee.positions as string).split(',').map(p => p.trim());
    } else {
      employeeData.positions = employee.positions || [];
    }

    // If accountType is pribadi, set accountHolderName to employee name
    if (employeeData.accountType === 'pribadi') {
        employeeData.accountHolderName = employeeData.name;
    }
    
    // Handle file uploads
    const fileFields: (keyof Employee)[] = ['avatar', 'ktpPhoto', 'simPhoto', 'sioPhoto', 'kartuKeluargaPhoto', 'bankBookPhoto'];
    for (const field of fileFields) {
        if (employeeData[field] && (employeeData[field] as string).startsWith('data:')) {
            employeeData[field] = await uploadFileAndGetURL(employeeData[field] as string, employeeId, field);
        }
    }

    // Set default password if provided, otherwise create default
    if (employeeData.password) {
        employeeData.password = createHash('md5').update(employeeData.password).digest('hex');
    } else {
        employeeData.password = createHash('md5').update('irena@2025').digest('hex');
    }

    // Set employee status based on actor's role
    if (actorRole === 'Administrator' || actorRole === 'HR') {
        employeeData.employeeStatus = employee.employeeStatus || 'active';
    } else {
        // Default to pending for other roles like Admin Proyek, Rekrutmen
        employeeData.employeeStatus = 'pending';
    }


    // Use setDoc with the custom ID (NIK)
    const docRef = doc(db, 'employees', employeeId);
    await setDoc(docRef, employeeData);

    return employeeId;
}

// Update an existing employee
export async function updateEmployee(id: string, employee: Partial<Employee>): Promise<void> {
   // Convert numeric fields from string to number
  const numericFields: (keyof Employee)[] = [
    'basicSalary', 'mealAllowance', 'transportAllowance', 'dailyWage', 'overtimeRate',
    'monthlySalary', 'otAllowance', 'locationAllowance', 'otherAllowances', 'koperasiLimit'
  ];
  const employeeData: { [key: string]: any } = { ...employee };

  numericFields.forEach(field => {
    if (employeeData[field] && typeof employeeData[field] === 'string') {
      (employeeData as any)[field] = Number(employeeData[field]);
    } else if (employeeData[field] === '') {
      (employeeData as any)[field] = null; // Convert empty string to null to remove field
    }
  });
  
  // Handle positions
  if (typeof employee.positions === 'string') {
    employeeData.positions = (employee.positions as string).split(',').map(p => p.trim());
  } else if (Array.isArray(employee.positions)) {
    employeeData.positions = employee.positions;
  }
  
  // Handle boolean for canGeneratePayslip
   if (employee.hasOwnProperty('canGeneratePayslip')) {
        employeeData.canGeneratePayslip = employee.canGeneratePayslip === true || (employee as any).canGeneratePayslip === 'on';
   }

  // If accountType is pribadi, set accountHolderName to employee name
  if (employeeData.accountType === 'pribadi') {
        const originalEmployeeDoc = await getDoc(doc(db, 'employees', id));
        if(originalEmployeeDoc.exists()) {
            employeeData.accountHolderName = originalEmployeeDoc.data().name;
        }
  }


  // Handle file uploads
  const fileFields: (keyof Employee)[] = ['avatar', 'ktpPhoto', 'simPhoto', 'sioPhoto', 'kartuKeluargaPhoto', 'bankBookPhoto'];
  for (const field of fileFields) {
      if (employeeData[field] && (employeeData[field] as string).startsWith('data:')) {
          employeeData[field] = await uploadFileAndGetURL(employeeData[field] as string, id, field);
      }
  }


  // Hash password only if it's being changed (i.e., it's not empty)
  if (employeeData.password) {
      employeeData.password = createHash('md5').update(employeeData.password).digest('hex');
  } else {
      // Avoid overwriting the existing password with an empty one
      delete employeeData.password;
  }

  const docRef = doc(db, 'employees', id);
  await updateDoc(docRef, employeeData);
}

// Delete an employee
export async function deleteEmployee(id: string): Promise<void> {
  const docRef = doc(db, 'employees', id);
  await deleteDoc(docRef);
}

// Delete multiple employees
export async function deleteEmployees(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach(id => {
    const docRef = doc(db, 'employees', id);
    batch.delete(docRef);
  });
  await batch.commit();
}


// Update Koperasi Limit Periode for multiple employees
export async function updateKoperasiLimitPeriode(
  employeeIds: string[],
  startDate: Date | string,
  endDate: Date | string
): Promise<void> {
  const batch = writeBatch(db);

  employeeIds.forEach(employeeId => {
    const docRef = doc(db, 'employees', employeeId);
    batch.update(docRef, {
      koperasiLimitStartDate: new Date(startDate),
      koperasiLimitEndDate: new Date(endDate),
    });
  });

  await batch.commit();
}
