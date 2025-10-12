import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import RecruitmentDashboard from '../recruitment-dashboard';
import type { User } from '@/lib/types';


export default async function RecruitmentPage() {
    const user = await getAdminSession();
    if (!user) {
        redirect('/');
    }

    const hasAccess = ['Administrator', 'HR'].includes(user.role);
    if (!hasAccess) {
        redirect('/dashboard');
    }
    
    return <RecruitmentDashboard user={user} />;
}
