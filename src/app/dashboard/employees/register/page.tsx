
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import RegisterEmployeeClientPage from './client-page';
import { User, Candidate } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getCandidateById(id: string): Promise<Candidate | null> {
    try {
        const docRef = doc(db, 'candidates', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Candidate;
        }
        return null;
    } catch (error) {
        console.error("Error fetching candidate by ID:", error);
        return null;
    }
}


export default async function RegisterEmployeePage({ searchParams }: { searchParams?: { candidateId?: string } }) {
  const currentUser = await getAdminSession();
  
  if (!currentUser) {
    redirect('/');
  }

  if (currentUser.role !== 'Admin Proyek' && currentUser.role !== 'Rekrutmen' && currentUser.role !== 'HR' && currentUser.role !== 'Administrator') {
    redirect('/dashboard');
  }

  let candidate: Candidate | undefined | null = undefined;
  if (searchParams?.candidateId) {
    candidate = await getCandidateById(searchParams.candidateId);
  }

  return <RegisterEmployeeClientPage user={currentUser as User} candidate={candidate || undefined} />;
}
