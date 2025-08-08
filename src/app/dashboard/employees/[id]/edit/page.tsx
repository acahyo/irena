

import { notFound } from 'next/navigation';
import type { Employee } from '@/lib/types';
import EditEmployeePageClient from './client-page';
import { getEmployee } from '@/actions/employees';
import { getDepartments } from '@/actions/departments';
import { getPositions } from '@/actions/positions';


export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const employee = await getEmployee(params.id);

  if (!employee) {
    notFound();
  }

  const departments = await getDepartments();
  const positions = await getPositions();

  return <EditEmployeePageClient employee={employee} departments={departments} positions={positions} />;
}
