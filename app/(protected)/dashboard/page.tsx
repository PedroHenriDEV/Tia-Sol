import { Dashboard } from '@/components/dashboard/dashboard';
import { listEvents } from '@/services/events';
import { createClient } from '@/lib/supabase/server';
import type { EventRecord } from '@/types/event';

export default async function Page() {
  const supabase = await createClient();
  let events: EventRecord[] = [];

  try {
    events = await listEvents(supabase);
  } catch {
    events = [];
  }

  return <Dashboard events={events} />;
}
