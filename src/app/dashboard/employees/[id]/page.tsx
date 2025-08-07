
import { employees } from '@/lib/data';
import { notFound } from 'next/navigation';
import EmployeeProfileClientPage from './client-page';


export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const employee = employees.find((e) => e.id === params.id);

  if (!employee) {
    notFound();
  }

  return <EmployeeProfileClientPage employee={employee} />;
}
