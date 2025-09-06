import { notFound } from 'next/navigation';
import type { Employee } from '@/lib/types';
import EditEmployeePageClient from './client-page';
import { getEmployee } from '@/actions/employees';
import { getDepartments } from '@/actions/departments';
import { getPositions } from '@/actions/positions';
import { getSites } from '@/actions/sites';


export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const employee = await getEmployee(params.id);

  if (!employee) {
    notFound();
  }

  const [departments, positions, sites] = await Promise.all([
    getDepartments(),
    getPositions(),
    getSites()
  ]);

  return <EditEmployeePageClient employee={employee} departments={departments} positions={positions} sites={sites} />;
}
