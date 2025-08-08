
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { User } from '@/lib/types';

export async function authenticateUser({ email, password }: Pick<User, 'email' | 'password'>): Promise<{ success: boolean; message: string; }> {
    if (!email || !password) {
        return { success: false, message: 'Email and password are required.' };
    }

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, message: 'Invalid email or password.' };
        }

        const userDoc = querySnapshot.docs[0];
        const user = userDoc.data() as User;

        // In a real app, passwords should be hashed and compared securely.
        // This is a simple comparison for demonstration purposes.
        if (user.password !== password) {
            return { success: false, message: 'Invalid email or password.' };
        }

        return { success: true, message: 'Login successful.' };

    } catch (error) {
        console.error("Authentication error:", error);
        return { success: false, message: 'An unexpected error occurred. Please try again.' };
    }
}
