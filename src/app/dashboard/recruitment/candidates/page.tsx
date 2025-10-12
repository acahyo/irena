
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import CandidatesClientPage from './client-page';
import { getCandidates } from '@/actions/candidates';
import { getPositions } from '@/actions/positions';
import { getSites } from '@/actions/sites';
import type { Candidate, Position, Site, User } from '@/lib/types';


export default async function CandidatesPage() {
  const user = await getAdminSession();
  
  if (!user || !['Administrator', 'HR', 'Rekrutmen'].includes(user.role)) {
    redirect('/dashboard');
  }

  const [candidatesData, positionsData, sitesData] = await Promise.all([
    getCandidates(),
    getPositions(),
    getSites()
  ]);

  return (
    <CandidatesClientPage 
      initialUser={user}
      initialCandidates={candidatesData}
      initialPositions={positionsData}
      initialSites={sitesData}
    />
  );
}
