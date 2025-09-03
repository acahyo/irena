
import { getSettings } from '@/actions/settings';
import AdminLoginPageClient from './admin-login-client';


export default async function AdminLoginPage() {
    const settings = await getSettings();

    return <AdminLoginPageClient settings={settings} />;
}
