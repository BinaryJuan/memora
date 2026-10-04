import { router, useLocalSearchParams } from 'expo-router';
import { EventForm } from '@/components/event-form';
import { showToast } from '@/components/toast';
import { Button, EmptyState, Header, Screen } from '@/components/ui';
import { deletePhoto } from '@/lib/media';
import { useStore } from '@/store/store';
import { Space } from '@/theme/theme';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useStore((s) => s.events.find((e) => e.id === id));
  const deleteEvent = useStore((s) => s.deleteEvent);
  const restoreEvent = useStore((s) => s.restoreEvent);

  if (!event) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="question" title="No encontramos esta fecha" />
      </Screen>
    );
  }

  // Se borra en el momento y queda unos segundos para deshacer; las fotos se borran recién al final.
  const remove = () => {
    const removed = event;
    router.dismissTo('/');
    deleteEvent(removed.id);
    showToast({
      message: `Borraste «${removed.title}»`,
      actionLabel: 'Deshacer',
      onAction: () => restoreEvent(removed),
      onExpire: () => removed.memories.forEach((m) => deletePhoto(m.photoUri)),
    });
  };

  return (
    <Screen>
      <Header title="Editar" />
      <EventForm initial={event} onSaved={() => router.back()} />
      <Button label="Borrar fecha" icon="trash-2" variant="danger" onPress={remove} style={{ marginTop: Space.md }} />
    </Screen>
  );
}
