import { Dashboard } from '@/components/dashboard/dashboard';
import { listEvents } from '@/services/events';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  let events = [];

  try {
    events = await listEvents(supabase);
  } catch {
    events = [];
  }

  return <Dashboard events={events} />;
}
