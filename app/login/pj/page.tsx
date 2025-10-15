import { getSettings } from '@/actions/settings';
import PjLoginPageClient from './client-page';


export default async function PjLoginPage() {
    const settings = await getSettings();

    return <PjLoginPageClient settings={settings} />;
}
