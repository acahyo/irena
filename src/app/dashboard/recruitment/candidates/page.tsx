
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getCandidates } from '@/actions/candidates';
import { getPositions } from '@/actions/positions';
import { User } from '@/lib/types';
import CandidatesClientPage from './client-page';


export default async function CandidatesPage() {
  const user = await getAdminSession();
  
  if (!user || !['Administrator', 'HR', 'Rekrutmen'].includes(user.role)) {
    redirect('/dashboard');
  }

  const [candidates, positions] = await Promise.all([
    getCandidates(),
    getPositions(),
  ]);

  return <CandidatesClientPage initialCandidates={candidates} positions={positions} user={user as User} />;
}
