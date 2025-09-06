import { getSettings } from '@/actions/settings';
import EmployeeLoginPageClient from '../../login-client';


export default async function EmployeeLoginPage() {
    const settings = await getSettings();

    return <EmployeeLoginPageClient settings={settings} />;
}
