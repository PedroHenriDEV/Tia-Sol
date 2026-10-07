import { Dashboard } from '@/components/dashboard/dashboard';
import { listEvents } from '@/services/events';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();

  try {
    const events = await listEvents(supabase);
    return <Dashboard events={events} />;
  } catch {
    return <Dashboard events={[]} />;
  }
}
