import { getEmployees } from '@/actions/employees';
import ContractTemplateClientPage from './client-page';

export default async function ContractTemplatePage() {
  const employees = await getEmployees();
  return <ContractTemplateClientPage employees={employees} />;
}
