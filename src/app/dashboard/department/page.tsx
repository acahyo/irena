import { getDepartments } from '@/actions/departments';
import DepartmentClientPage from './client-page';

export default async function DepartmentPage() {
  const initialDepartments = await getDepartments();

  return <DepartmentClientPage initialDepartments={initialDepartments} />;
}
