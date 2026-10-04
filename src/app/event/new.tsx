import { router, useLocalSearchParams } from 'expo-router';

import { EventForm } from '@/components/event-form';
import { Header, Screen } from '@/components/ui';

export default function NewEventScreen() {
  const params = useLocalSearchParams<{ day?: string; month?: string }>();
  const defaults = {
    day: params.day ? Number(params.day) : undefined,
    month: params.month ? Number(params.month) : undefined,
  };
  return (
    <Screen>
      <Header title="Nueva fecha" />
      <EventForm
        defaults={defaults}
        onSaved={(id) => router.replace({ pathname: '/event/[id]', params: { id } })}
      />
    </Screen>
  );
}
