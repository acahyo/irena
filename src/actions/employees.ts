'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp, writeBatch, setDoc } from 'firebase/firestore';
import type { Employee } from '@/lib/types';
import { format } from 'date-fns';
import { createHash } from 'crypto';


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


// Get all employees
export async function getEmployees(): Promise<Employee[]> {
  const querySnapshot = await getDocs(collection(db, 'employees'));
  const employees: Employee[] = [];
  querySnapshot.forEach((doc) => {
    const data = convertTimestampsToDates(doc.data());
    // Ensure password is not sent to the client
    delete data.password;
    employees.push({ id: doc.id, ...data } as Employee);
  });
  return employees;
}

// Get a single employee by ID
export async function getEmployee(id: string): Promise<Employee | null> {
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
}

// Create a new employee
export async function createEmployee(employee: Partial<Employee>): Promise<string> {
    // Convert numeric fields from string to number
    const numericFields: (keyof Employee)[] = [
        'basicSalary', 'mealAllowance', 'transportAllowance', 'dailyWage', 'overtimeRate',
        'monthlySalary', 'otAllowance', 'locationAllowance', 'otherAllowances'
    ];
    const employeeData = { ...employee };

    numericFields.forEach(field => {
        if (employeeData[field] && typeof employeeData[field] === 'string') {
        (employeeData as any)[field] = Number(employeeData[field]);
        }
    });

    // Generate custom employee ID
    const registrationDate = format(new Date(), 'ddMMyyyy');
    const birthYear = employee.dateOfBirth ? format(new Date(employee.dateOfBirth), 'yyyy') : '0000';
    
    // Get current employee count for sequential number
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    const sequentialNumber = (employeesSnapshot.size + 1).toString().padStart(4, '0');
    
    const employeeId = `IBA${registrationDate}${birthYear}${sequentialNumber}`;

    // Set default password
    employeeData.password = createHash('md5').update('irena@2025').digest('hex');

    // Use setDoc with the custom ID
    const docRef = doc(db, 'employees', employeeId);
    await setDoc(docRef, employeeData);

    return employeeId;
}

// Update an existing employee
export async function updateEmployee(id: string, employee: Partial<Employee>): Promise<void> {
   // Convert numeric fields from string to number
  const numericFields: (keyof Employee)[] = [
    'basicSalary', 'mealAllowance', 'transportAllowance', 'dailyWage', 'overtimeRate',
    'monthlySalary', 'otAllowance', 'locationAllowance', 'otherAllowances'
  ];
  const employeeData = { ...employee };

  numericFields.forEach(field => {
    if (employeeData[field] && typeof employeeData[field] === 'string') {
      (employeeData as any)[field] = Number(employeeData[field]);
    } else if (employeeData[field] === '') {
      (employeeData as any)[field] = null; // Convert empty string to null to remove field
    }
  });

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

// Import multiple employees
export async function importEmployees(employees: Partial<Employee>[]) {
    const batch = writeBatch(db);
    const defaultPassword = createHash('md5').update('irena@2025').digest('hex');
    
    employees.forEach(employee => {
        const docRef = doc(collection(db, 'employees'));
        // We don't need to add an id, Firestore does it automatically
        const { id, ...employeeData } = employee; 
        employeeData.password = defaultPassword;
        batch.set(docRef, employeeData);
    });

    await batch.commit();
}
