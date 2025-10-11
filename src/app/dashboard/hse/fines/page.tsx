import { getHseRecords } from '@/actions/hse';
import IncidentFinesClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function IncidentFinesPage() {
    const user = await getAdminSession();
    if (!user || !['Administrator', 'HSE', 'Disipliner'].includes(user.role)) {
        redirect('/dashboard');
    }

    const allRecords = await getHseRecords();
    const incidentRecords = allRecords.filter(
        record => record.category === 'incident' && record.hasFine && record.fineAmount && record.fineAmount > 0
    );

    return <IncidentFinesClientPage incidentRecords={incidentRecords} />;
}
