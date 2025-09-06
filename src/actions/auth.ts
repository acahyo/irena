'use server';

import { createHash } from 'crypto';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { User, Employee } from '@/lib/types';
import { cookies } from 'next/headers';
import { getEmployee } from './employees';

const SESSION_COOKIE_NAME = 'employee-session';

export async function authenticateUser(
    { email, password }: Pick<User, 'email' | 'password'>, 
    userType: 'admin' | 'employee'
): Promise<{ success: boolean; message: string; userType: 'admin' | 'employee' | null }> {
    if (!email || !password) {
        return { success: false, message: 'Email and password are required.', userType: null };
    }

    try {
        const hashedPassword = createHash('md5').update(password).digest('hex');

        if (userType === 'admin') {
            // Check for Admin User
            const usersRef = collection(db, 'users');
            const adminQuery = query(usersRef, where('email', '==', email));
            const adminSnapshot = await getDocs(adminQuery);

            if (!adminSnapshot.empty) {
                const userDoc = adminSnapshot.docs[0];
                const user = userDoc.data() as User;

                if (user.password === hashedPassword) {
                    // In a real app, you'd set a session for the admin here as well.
                    return { success: true, message: 'Admin login successful.', userType: 'admin' };
                }
            }
        } else if (userType === 'employee') {
            // Check for Employee User
            const employeesRef = collection(db, 'employees');
            const employeeQuery = query(employeesRef, where('email', '==', email));
            const employeeSnapshot = await getDocs(employeeQuery);

            if (!employeeSnapshot.empty) {
                const employeeDoc = employeeSnapshot.docs[0];
                const employee = employeeDoc.data() as Employee;
                
                if (employee.password === hashedPassword) {
                    // Set employee session cookie
                    const sessionData = {
                        id: employeeDoc.id,
                        name: employee.name || 'Employee',
                        email: employee.email || '',
                        avatar: employee.avatar || '',
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
        }
        
        // If no user found
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
            const sessionData = JSON.parse(sessionCookie.value);
            // Basic validation to ensure the session object is what we expect
            if (sessionData && sessionData.id) {
                 // Fetch the full, up-to-date employee record from the database
                 const employee = await getEmployee(sessionData.id);
                 return employee;
            }
            return null;
        } catch (error) {
            console.error("Error parsing session cookie or fetching employee:", error);
            return null;
        }
    }
    return null;
}

export async function logout() {
    cookies().delete(SESSION_COOKIE_NAME);
}
