import { getPositions } from '@/actions/positions';
import PositionClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getSitesByIds } from '@/actions/sites';

export default async function PositionPage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/dashboard');
  }

  const [initialPositions] = await Promise.all([
    getPositions(),
  ]);

  let filteredPositions = initialPositions;

  if (user.role === 'Admin Proyek' && user.siteIds && user.siteIds.length > 0) {
      const userSites = await getSitesByIds(user.siteIds);
      const userSiteNames = userSites.map(s => s.name);
      
      filteredPositions = initialPositions.filter(pos => 
        !pos.projectName || userSiteNames.includes(pos.projectName)
      );
  }
  
  return <PositionClientPage initialPositions={filteredPositions} />;
}
