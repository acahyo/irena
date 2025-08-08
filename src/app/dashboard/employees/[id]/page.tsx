

import { getEmployee } from '@/actions/employees';
import { notFound } from 'next/navigation';
import EmployeeProfileClientPage from './client-page';


export default async function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const employee = await getEmployee(params.id);

  if (!employee) {
    notFound();
  }

  return <EmployeeProfileClientPage employee={employee} />;
}
