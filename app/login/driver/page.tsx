import { getSettings } from '@/actions/settings';
import DriverLoginPageClient from './client-page';


export default async function DriverLoginPage() {
    const settings = await getSettings();

    return <DriverLoginPageClient settings={settings} />;
}
