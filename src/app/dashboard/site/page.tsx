
import { getSites } from '@/actions/sites';
import SiteClientPage from './client-page';

export default async function SitePage() {
  const initialSites = await getSites();

  return <SiteClientPage initialSites={initialSites} />;
}
