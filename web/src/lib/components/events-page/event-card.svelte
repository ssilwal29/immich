<script lang="ts">
  import { goto } from '$app/navigation';
  import { clickOutside } from '$lib/actions/click-outside';
  import { AppRoute } from '$lib/constants';
  import EventEditModal from '$lib/modals/EventEditModal.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetMediaSize, deleteEvent, type EventResponseDto } from '@immich/sdk';
  import { Icon, modalManager, toastManager } from '@immich/ui';
  import {
    mdiAccountCircleOutline,
    mdiDotsVertical,
    mdiImageMultiple,
    mdiPencilOutline,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    event: EventResponseDto;
    onDelete?: (eventId: string) => void;
    onUpdate?: (event: EventResponseDto) => void;
  }

  let { event = $bindable(), onDelete, onUpdate }: Props = $props();

  let showMenu = $state(false);
  let isOwner = $derived(event.isOwner === true);
  let hasAlbums = $derived((event.albumCount ?? 0) > 0);
  let canDelete = $derived(isOwner && !hasAlbums);

  const handleClick = () => {
    goto(`${AppRoute.EVENTS}/${event.id}/albums`);
  };

  const handleEdit = async () => {
    showMenu = false;
    const modal = await modalManager.open(EventEditModal, { event });
    const updatedEvent = await modal;
    if (updatedEvent && onUpdate) {
      onUpdate(updatedEvent);
    }
  };

  const handleDelete = async () => {
    showMenu = false;

    const isConfirmed = await modalManager.showDialog({
      prompt: `Are you sure you want to delete "${event.eventName}"?`,
      confirmText: $t('delete'),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteEvent({ id: event.id });
      toastManager.success($t('event_deleted'));
      if (onDelete) {
        onDelete(event.id);
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_event'));
    }
  };

  const thumbnailUrl = event.eventThumbnailAssetId
    ? getAssetThumbnailUrl({ id: event.eventThumbnailAssetId, size: AssetMediaSize.Preview })
    : undefined;

  const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  let updatedDate = $derived(dateFormatter.format(new Date(event.updatedAt ?? event.createdAt)));
  let albumCountLabel = $derived($t('album_count', { values: { count: event.albumCount ?? 0 } }));
  let isShared = $derived(!event.isOwner);
</script>

<button
  type="button"
  class="group relative flex flex-col w-full max-w-xs overflow-hidden rounded-xl bg-immich-bg dark:bg-immich-dark-gray text-left shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-immich-primary {isShared
    ? 'ring-1 ring-emerald-400/30'
    : ''}"
  on:click={handleClick}
>
  <!-- Image Container -->
  <div class="relative w-full aspect-[3/2] overflow-hidden bg-gray-100 dark:bg-gray-900">
    {#if thumbnailUrl}
      <img
        src={thumbnailUrl}
        alt={event.eventName}
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
    {:else}
      <div
        class="flex h-full w-full items-center justify-center bg-gradient-to-br {isShared
          ? 'from-emerald-400 to-teal-700'
          : 'from-indigo-500 to-purple-700'}"
      ></div>
    {/if}

    <!-- Title overlay -->
    <div class="absolute bottom-0 left-0 right-0 p-4">
      <h3 class="text-lg sm:text-xl font-semibold text-white drop-shadow-lg line-clamp-2">
        {event.eventName}
      </h3>
    </div>

    <!-- Options menu -->
    {#if isOwner}
      <div class="absolute top-2 right-2" on:click={(e) => e.stopPropagation()}>
        <div class="relative">
          <button
            type="button"
            class="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            on:click={(e) => {
              e.stopPropagation();
              showMenu = !showMenu;
            }}
            aria-label="Options"
          >
            <Icon icon={mdiDotsVertical} size="20" class="text-white" />
          </button>
          {#if showMenu}
            <div
              use:clickOutside={{ onOutclick: () => (showMenu = false) }}
              class="absolute right-0 top-full mt-1 w-44 rounded-lg bg-white dark:bg-immich-dark-gray shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
              on:click={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 text-immich-fg dark:text-immich-dark-fg transition-colors"
                on:click={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
              >
                <Icon icon={mdiPencilOutline} size="18" />
                <span>{$t('edit')}</span>
              </button>
              {#if canDelete}
                <button
                  type="button"
                  class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  on:click={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  <Icon icon={mdiTrashCanOutline} size="18" />
                  <span>{$t('delete')}</span>
                </button>
              {:else}
                <div
                  class="flex flex-col gap-1.5 w-full px-4 py-3 text-sm cursor-not-allowed bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50 border-t border-gray-200 dark:border-gray-700"
                >
                  <div class="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                    <Icon icon={mdiTrashCanOutline} size="28" class="opacity-60" />
                    <span class="font-semibold text-xs">{$t('delete_event_not_empty')}</span>
                  </div>
                  <!-- <p class="text-xs text-gray-500 dark:text-gray-500 ml-7">
                    {$t('delete_event_not_empty_description')}
                  </p> -->
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Shared badge -->
    {#if isShared}
      <div class="absolute top-3 right-3">
        <div
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm bg-emerald-600/90 shadow-lg"
        >
          <Icon icon={mdiAccountCircleOutline} size="14" class="text-white" />
          <span class="text-xs font-semibold text-white">SHARED</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Content Section -->
  <div class="flex flex-col gap-2 p-4 text-immich-fg dark:text-immich-dark-fg">
    {#if event.description}
      <p class="text-sm text-immich-fg/70 dark:text-gray line-clamp-2">
        {event.description}
      </p>
    {/if}

    <!-- Metadata -->
    <div class="flex flex-wrap items-center gap-x-3 gap-y-3 text-xs text-immich-fg/60 dark:text-gray">
      <div class="flex items-center gap-1 text-immich-primary">
        <Icon icon={mdiImageMultiple} size="14" />
        <span class="font-medium">{event.albumCount}</span>
      </div>

      <div class="flex items-center gap-1">
        <Icon icon={mdiAccountCircleOutline} size="14" />
        <span class="font-medium truncate max-w-[100px] sm:max-w-[120px]">{event.owner.name}</span>
      </div>

      <time class="font-medium whitespace-nowrap">{updatedDate}</time>
    </div>
  </div>
</button>
