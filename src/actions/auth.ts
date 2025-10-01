'use server';

import { createHash } from 'crypto';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { User, Employee } from '@/lib/types';
import { cookies } from 'next/headers';
import { getEmployee } from './employees';
import { getUser } from './users';

const ADMIN_SESSION_COOKIE_NAME = 'admin-session';
const EMPLOYEE_SESSION_COOKIE_NAME = 'employee-session';

export async function authenticateUser(
    { email, password }: Pick<User, 'email' | 'password'>, 
    userType: 'admin' | 'employee' | 'driver'
): Promise<{ success: boolean; message: string; userType: 'admin' | 'employee' | 'driver' | null }> {
    if (!email || !password) {
        return { success: false, message: 'Email and password are required.', userType: null };
    }

    try {
        const hashedPassword = createHash('md5').update(password).digest('hex');

        if (userType === 'admin') {
            const usersRef = collection(db, 'users');
            const adminQuery = query(usersRef, where('email', '==', email));
            const adminSnapshot = await getDocs(adminQuery);

            if (!adminSnapshot.empty) {
                const userDoc = adminSnapshot.docs[0];
                const user = userDoc.data() as User;

                if (user.password === hashedPassword) {
                    const sessionData = { id: userDoc.id, role: user.role };
                    cookies().set(ADMIN_SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 60 * 60 * 24, // 1 day
                        path: '/',
                    });
                    return { success: true, message: 'Admin login successful.', userType: 'admin' };
                }
            }
        } else if (userType === 'employee' || userType === 'driver') {
            const employeesRef = collection(db, 'employees');
            const employeeQuery = query(employeesRef, where('email', '==', email));
            const employeeSnapshot = await getDocs(employeeQuery);

            if (!employeeSnapshot.empty) {
                const employeeDoc = employeeSnapshot.docs[0];
                const employee = employeeDoc.data() as Employee;
                
                if (employee.password === hashedPassword) {
                    const isDriver = employee.role === 'Driver LV Office';

                    // If login is from driver page, only allow drivers
                    if (userType === 'driver' && !isDriver) {
                         return { success: false, message: 'This account is not registered as a driver.', userType: null };
                    }
                    // If login is from employee page, do not allow drivers
                    if (userType === 'employee' && isDriver) {
                         return { success: false, message: 'This is a driver account. Please log in through the driver portal.', userType: null };
                    }
                    
                    const sessionData = { id: employeeDoc.id, role: employee.role };
                    cookies().set(EMPLOYEE_SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 60 * 60 * 24 * 7, // 1 week
                        path: '/',
                    });
                    
                    if (isDriver) {
                         return { success: true, message: 'Driver login successful.', userType: 'driver' };
                    }
                    return { success: true, message: 'Employee login successful.', userType: 'employee' };
                }
            }
        }
        
        return { success: false, message: 'Invalid email or password.', userType: null };

    } catch (error) {
        console.error("Authentication error:", error);
        return { success: false, message: 'An unexpected error occurred. Please try again.', userType: null };
    }
}

export async function getAdminSession(): Promise<User | null> {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME);

    if (sessionCookie?.value) {
        try {
            const sessionData = JSON.parse(sessionCookie.value);
            if (sessionData && sessionData.id) {
                 const user = await getUser(sessionData.id);
                 return user;
            }
        } catch (error) {
            console.error("Error parsing admin session cookie:", error);
            // In case of parsing error, treat as no session
            return null;
        }
    }
    return null;
}


export async function getEmployeeSession(): Promise<Employee | null> {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(EMPLOYEE_SESSION_COOKIE_NAME);

    if (sessionCookie?.value) {
        try {
            const sessionData = JSON.parse(sessionCookie.value);
            if (sessionData && sessionData.id) {
                 const employee = await getEmployee(sessionData.id);
                 return employee;
            }
        } catch (error) {
            console.error("Error parsing employee session cookie:", error);
             // In case of parsing error, treat as no session
            return null;
        }
    }
    return null;
}

export async function logout(userType: 'admin' | 'employee' | 'all') {
    if (userType === 'admin' || userType === 'all') {
        cookies().set(ADMIN_SESSION_COOKIE_NAME, '', { expires: new Date(0), path: '/' });
    }
    if (userType === 'employee' || userType === 'all') {
        cookies().set(EMPLOYEE_SESSION_COOKIE_NAME, '', { expires: new Date(0), path: '/' });
    }
}
