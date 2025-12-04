<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { updateEventInfo, type EventResponseDto } from '@immich/sdk';
  import { Button, Field, Input, Modal, ModalBody, ModalFooter, Textarea } from '@immich/ui';
  import { mdiPencilOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    event: EventResponseDto;
    onClose: (event?: EventResponseDto) => void;
  };

  let { event = $bindable(), onClose }: Props = $props();

  let eventName = $state(event.eventName);
  let description = $state(event.description);
  let isSubmitting = $state(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    isSubmitting = true;

    try {
      const updatedEvent = await updateEventInfo({
        id: event.id,
        updateEventDto: { eventName, description },
      });
      event.eventName = eventName;
      event.description = description;
      onClose(updatedEvent);
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_event'));
    } finally {
      isSubmitting = false;
    }
  };
</script>

<Modal icon={mdiPencilOutline} title={$t('edit_event')} size="medium" {onClose}>
  <ModalBody>
    <form onsubmit={handleSubmit} autocomplete="off" id="edit-event-form">
      <div class="flex flex-col gap-4 m-4">
        <Field label={$t('name')}>
          <Input bind:value={eventName} required />
        </Field>

        <Field label={$t('description')}>
          <Textarea bind:value={description} />
        </Field>
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack>
      <Button color="secondary" size="small" onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button type="submit" size="small" disabled={isSubmitting} form="edit-event-form">{$t('save')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
