
import { getSites } from '@/actions/sites';
import ProjectClientPage from './client-page';

export default async function ProjectPage() {
  const initialSites = await getSites();

  return <ProjectClientPage initialSites={initialSites} />;
}
