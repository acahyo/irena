
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { User } from '@/lib/types';
import CandidatesClientPage from './client-page';


export default async function CandidatesPage() {
  const user = await getAdminSession();
  
  if (!user || !['Administrator', 'HR', 'Rekrutmen'].includes(user.role)) {
    redirect('/dashboard');
  }

  // The client component will now handle all data fetching
  return <CandidatesClientPage user={user as User} />;
}
