
'use server';

import { createHash } from 'crypto';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { User, Employee } from '@/lib/types';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'employee-session';

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

export async function authenticateUser({ email, password }: Pick<User, 'email' | 'password'>): Promise<{ success: boolean; message: string; userType: 'admin' | 'employee' | null }> {
    if (!email || !password) {
        return { success: false, message: 'Email and password are required.', userType: null };
    }

    try {
        const hashedPassword = createHash('md5').update(password).digest('hex');

        // 1. Check for Admin User
        const usersRef = collection(db, 'users');
        const adminQuery = query(usersRef, where('email', '==', email));
        const adminSnapshot = await getDocs(adminQuery);

        if (!adminSnapshot.empty) {
            const userDoc = adminSnapshot.docs[0];
            const user = userDoc.data() as User;

            if (user.password === hashedPassword) {
                // Set admin session if needed, or handle as before
                return { success: true, message: 'Admin login successful.', userType: 'admin' };
            }
        }

        // 2. Check for Employee User
        const employeesRef = collection(db, 'employees');
        const employeeQuery = query(employeesRef, where('email', '==', email));
        const employeeSnapshot = await getDocs(employeeQuery);

        if (!employeeSnapshot.empty) {
            const employeeDoc = employeeSnapshot.docs[0];
            const employee = employeeDoc.data() as Employee;
            
            if (employee.password === hashedPassword) {
                // Set employee session cookie
                // IMPORTANT: Only store serializable data in the cookie. Avoid complex objects like Dates.
                const sessionData = {
                    id: employeeDoc.id,
                    name: employee.name,
                    email: employee.email,
                    avatar: employee.avatar,
                };
                cookies().set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24 * 7, // 1 week
                    path: '/',
                });

                return { success: true, message: 'Employee login successful.', userType: 'employee' };
            }
        }
        
        // 3. If no user found in either collection
        return { success: false, message: 'Invalid email or password.', userType: null };

    } catch (error) {
        console.error("Authentication error:", error);
        return { success: false, message: 'An unexpected error occurred. Please try again.', userType: null };
    }
}

export async function getEmployeeSession(): Promise<Employee | null> {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie) {
        try {
            const sessionData = JSON.parse(sessionCookie.value) as Employee;
            // Basic validation to ensure the session object is what we expect
            if (sessionData && sessionData.id && sessionData.email) {
                 return sessionData;
            }
            return null;
        } catch (error) {
            console.error("Error parsing session cookie:", error);
            return null;
        }
    }
    return null;
}

export async function logout() {
    cookies().delete(SESSION_COOKIE_NAME);
}
