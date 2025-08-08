

import { notFound } from 'next/navigation';
import { departments, positions } from '@/lib/data';
import type { Employee } from '@/lib/types';
import EditEmployeePageClient from './client-page';
import { getEmployee } from '@/actions/employees';


export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const employee = await getEmployee(params.id);

  if (!employee) {
    notFound();
  }

  return <EditEmployeePageClient employee={employee} departments={departments} positions={positions} />;
}
