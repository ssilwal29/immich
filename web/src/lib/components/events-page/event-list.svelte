<script lang="ts">
  import EventCard from '$lib/components/events-page/event-card.svelte';
  import type { EventResponseDto } from '@immich/sdk';

  interface Props {
    events: EventResponseDto[];
  }

  let { events }: Props = $props();
</script>

<!-- In your events list page (e.g., +page.svelte) -->
<div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 p-4">
  {#each events as event}
    <EventCard {event} />
  {/each}
</div>
