
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

  // Serialize date objects in statusHistory to prevent hydration errors.
  const serializedCandidates = candidatesData.map(candidate => ({
    ...candidate,
    appliedDate: new Date(candidate.appliedDate).toISOString(),
    dateOfBirth: candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toISOString() : undefined,
    statusHistory: candidate.statusHistory?.map(historyItem => ({
      ...historyItem,
      date: new Date(historyItem.date as Date).toISOString(),
    }))
  }));

  return (
    <CandidatesClientPage 
      initialUser={user}
      initialCandidates={serializedCandidates}
      initialPositions={positionsData}
      initialSites={sitesData}
    />
  );
}
