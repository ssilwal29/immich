<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize, type EventResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiAccountCircleOutline, mdiImageMultiple } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    event: EventResponseDto;
  }

  let { event }: Props = $props();

  const handleClick = () => {
    goto(`${AppRoute.EVENTS}/${event.id}/albums`);
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
