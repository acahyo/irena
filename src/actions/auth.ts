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
    userType: 'admin' | 'employee' | 'driver' | 'pj'
): Promise<{ success: boolean; message: string; userType: 'admin' | 'employee' | 'driver' | 'pj' | null }> {
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
        } else if (userType === 'employee' || userType === 'driver' || userType === 'pj') {
            const employeesRef = collection(db, 'employees');
            const employeeQuery = query(employeesRef, where('email', '==', email));
            const employeeSnapshot = await getDocs(employeeQuery);

            if (!employeeSnapshot.empty) {
                const employeeDoc = employeeSnapshot.docs[0];
                const employee = employeeDoc.data() as Employee;
                
                if (employee.password === hashedPassword) {
                    const isDriver = employee.positions?.includes('Driver LV Office');
                    const isPj = employee.positions?.includes('PJ');

                    if (userType === 'driver' && !isDriver) {
                         return { success: false, message: 'This account is not registered as a driver.', userType: null };
                    }
                    if (userType === 'pj' && !isPj) {
                        return { success: false, message: 'Akun ini tidak terdaftar sebagai PJ.', userType: null };
                    }
                    if (userType === 'employee' && (isDriver || isPj)) {
                         return { success: false, message: 'This is a special account. Please log in through the correct portal.', userType: null };
                    }
                    
                    const sessionData = { id: employeeDoc.id, roles: employee.positions };
                    cookies().set(EMPLOYEE_SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 60 * 60 * 24 * 7, // 1 week
                        path: '/',
                    });
                    
                    if (isDriver) {
                         return { success: true, message: 'Driver login successful.', userType: 'driver' };
                    }
                    if (isPj) {
                        return { success: true, message: 'PJ login successful.', userType: 'pj' };
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
