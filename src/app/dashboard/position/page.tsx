
import { getPositions } from '@/actions/positions';
import PositionClientPage from './client-page';

export default async function PositionPage() {
  const initialPositions = await getPositions();
  
  return <PositionClientPage initialPositions={initialPositions} />;
}
