
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import CandidatesClientPage from './client-page';

export default async function CandidatesPage() {
  const user = await getAdminSession();
  
  if (!user || !['Administrator', 'HR', 'Rekrutmen'].includes(user.role)) {
    redirect('/dashboard');
  }

  // The client component will now handle all data fetching
  return <CandidatesClientPage />;
}
