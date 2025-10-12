import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import NewEmployeePageClient from './client-page';
import { getDepartments } from '@/actions/departments';
import { getPositions } from '@/actions/positions';
import { getSites } from '@/actions/sites';
import { getCandidateById } from '@/actions/candidates';
import type { Candidate } from '@/lib/types';

export default async function NewEmployeePage({ searchParams }: { searchParams: { candidateId?: string } }) {
  const user = await getAdminSession();
  
  if (!user || !['Administrator', 'HR', 'Rekrutmen', 'Admin Proyek'].includes(user.role)) {
    redirect('/dashboard');
  }

  const [departments, positions, sites] = await Promise.all([
    getDepartments(),
    getPositions(),
    getSites(),
  ]);

  let candidate: Candidate | null = null;
  if (searchParams.candidateId) {
    candidate = await getCandidateById(searchParams.candidateId);
  }

  return (
    <NewEmployeePageClient
      departments={departments}
      positions={positions}
      sites={sites}
      user={user}
      candidate={candidate}
    />
  );
}
