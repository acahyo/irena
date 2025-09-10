
'use server';

import { db } from './firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { createHash } from 'crypto';
import type { User, Role, Department, Position, Site, Employee } from './types';
import { format } from 'date-fns';

const users: Omit<User, 'id'>[] = [
    { name: 'Admin Irena', email: 'admin@irena.com', password: createHash('md5').update('admin').digest('hex'), role: 'Administrator' },
    { name: 'HRD Irena', email: 'hrd@irena.com', password: createHash('md5').update('hrd').digest('hex'), role: 'HR' },
];

const roles: Omit<Role, 'id'>[] = [
    { name: 'Administrator', description: 'Full access to all features', accessibleMenus: ['dashboard', 'employees', 'leave-schedule', 'payroll', 'attendance', 'payslip', 'payslip-collective', 'department', 'position', 'project', 'users', 'roles', 'settings'] },
    { name: 'HR', description: 'Access to HR-related features', accessibleMenus: ['dashboard', 'employees', 'leave-schedule', 'payroll', 'attendance', 'payslip', 'payslip-collective'] },
    { name: 'Employee', description: 'Access to personal portal only', accessibleMenus: [] },
];

const departments: Omit<Department, 'id'>[] = [
    { name: 'Technology' },
    { name: 'Human Resources' },
    { name: 'Operation' },
    { name: 'Finance' },
    { name: 'Marketing' },
];

const sites: Omit<Site, 'id'>[] = [
    { name: 'Head Office - Jakarta' },
    { name: 'Site - Kalimantan Timur' },
    { name: 'Site - Sulawesi Selatan' },
];

const positions: Omit<Position, 'id'>[] = [
    { name: 'Direktur Utama', salaryType: 'direksi', monthlySalary: 50000000 },
    { name: 'General Manager', salaryType: 'bulanan', monthlySalary: 25000000, allowances: [{ name: 'Tunjangan Jabatan', amount: 5000000 }] },
    { name: 'Operator Excavator', salaryType: 'harian', dailyWage: 250000, overtimeRate: 35000 },
    { name: 'Driver Dump Truck', salaryType: 'harian', dailyWage: 220000, overtimeRate: 30000 },
    { name: 'Staff HRD', salaryType: 'bulanan', monthlySalary: 7000000 },
];

const employees: Omit<Employee, 'id'>[] = [
   {
    name: 'Budi Santoso',
    email: 'budi.santoso@irena.com',
    password: createHash('md5').update('irena@2025').digest('hex'),
    role: 'Employee',
    department: 'Operation',
    position: 'Operator Excavator',
    siteLocation: 'Site - Kalimantan Timur',
    nik: '3201011010900001',
    placeOfBirth: 'Bandung',
    dateOfBirth: '1990-10-10',
    gender: 'Laki-laki',
    address: 'Jl. Merdeka No. 10, Bandung',
    phone: '081234567890',
    maritalStatus: 'married',
    bankName: 'BCA',
    accountNumber: '1234567890',
    accountHolderName: 'Budi Santoso',
    employeeStatus: 'active',
    contractStartDate: '2023-01-15',
    contractEndDate: '2025-01-15',
  },
  {
    name: 'Citra Lestari',
    email: 'citra.lestari@irena.com',
    password: createHash('md5').update('irena@2025').digest('hex'),
    role: 'Employee',
    department: 'Human Resources',
    position: 'Staff HRD',
    siteLocation: 'Head Office - Jakarta',
    nik: '3201012005920002',
    placeOfBirth: 'Jakarta',
    dateOfBirth: '1992-05-20',
    gender: 'Perempuan',
    address: 'Jl. Sudirman No. 25, Jakarta',
    phone: '081298765432',
    maritalStatus: 'single',
    bankName: 'Mandiri',
    accountNumber: '0987654321',
    accountHolderName: 'Citra Lestari',
    employeeStatus: 'active',
    contractStartDate: '2022-08-01',
    contractEndDate: '2024-08-01',
  }
];


async function seedCollection<T>(collectionName: string, data: T[]) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    if (snapshot.empty) {
        console.log(`Seeding ${collectionName}...`);
        const batch = writeBatch(db);
        data.forEach(item => {
            let docData = { ...item };
            // Custom ID generation for employees
            if (collectionName === 'employees') {
                const registrationDate = format(new Date(), 'ddMMyyyy');
                const birthYear = (item as any).dateOfBirth ? format(new Date((item as any).dateOfBirth), 'yyyy') : '0000';
                const sequentialNumber = (data.indexOf(item) + 1).toString().padStart(4, '0');
                const employeeId = `IBA${registrationDate}${birthYear}${sequentialNumber}`;
                const docRef = doc(collectionRef, employeeId);
                batch.set(docRef, docData);
            } else {
                 const docRef = doc(collectionRef);
                 batch.set(docRef, docData);
            }
        });
        await batch.commit();
        console.log(`${collectionName} seeded successfully.`);
    } else {
        console.log(`${collectionName} already contains data. Skipping seed.`);
    }
}

export async function seedDatabase() {
    console.log("Starting database seed process...");
    try {
        await Promise.all([
            seedCollection('users', users),
            seedCollection('roles', roles),
            seedCollection('departments', departments),
            seedCollection('positions', positions),
            seedCollection('sites', sites),
            seedCollection('employees', employees)
        ]);
        console.log("Database seed process completed.");
        return { success: true, message: "Database seeded successfully." };
    } catch (error) {
        console.error("Error seeding database:", error);
        return { success: false, message: `Error seeding database: ${error}` };
    }
}
