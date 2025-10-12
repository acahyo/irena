

import { getAdminSession } from '@/actions/auth';
import { redirect, notFound } from 'next/navigation';
import RegisterEmployeeClientPage from './client-page';
import { User, Site, Candidate } from '@/lib/types';
import { getSitesByIds } from '@/actions/sites';
import { getCandidates } from '@/actions/candidates';


export default async function RegisterEmployeePage({ searchParams }: { searchParams?: { candidateId?: string } }) {
  const currentUser = await getAdminSession();
  
  if (!currentUser) {
    redirect('/');
  }

  if (currentUser.role !== 'Admin Proyek' && currentUser.role !== 'Rekrutmen' && currentUser.role !== 'HR' && currentUser.role !== 'Administrator') {
    redirect('/dashboard');
  }

  let candidate: Candidate | undefined = undefined;
  if (searchParams?.candidateId) {
    const allCandidates = await getCandidates();
    candidate = allCandidates.find(c => c.id === searchParams.candidateId);
  }

  return <RegisterEmployeeClientPage user={currentUser as User} candidate={candidate} />;
}
