import { getSponsors, getHideDummySponsors } from '@/app/actions/sponsors';
import SponsorsClient from './SponsorsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSponsorsPage() {
  const sponsors = await getSponsors();
  const hideDummy = await getHideDummySponsors();
  
  return (
    <SponsorsClient initialSponsors={sponsors as any} initialHideDummy={hideDummy} />
  );
}
