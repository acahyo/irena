import { getEmployeeSession } from '@/actions/auth';
import { getEmployee } from '@/actions/employees';
import { notFound, redirect } from 'next/navigation';
import EditMyProfileClientPage from './client-page';

export default async function EditMyProfilePage() {
  const session = await getEmployeeSession();

  if (!session?.id) {
    redirect('/');
  }

  const employee = await getEmployee(session.id);

  if (!employee) {
    notFound();
  }

  return <EditMyProfileClientPage employee={employee} />;
}
