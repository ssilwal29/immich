<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiCamera } from '@mdi/js';
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { tweened } from 'svelte/motion';

  let showing = $state(false);

  // delay showing any progress for a little bit so very fast loads
  // do not cause flicker
  const delay = 100;

  const progress = tweened(0, {
    duration: 1000,
    easing: cubicOut,
  });

  function animate() {
    showing = true;
    void progress.set(90);
  }

  onMount(() => {
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  });
</script>

{#if showing}
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-immich-bg/80 dark:bg-immich-dark-bg/80 backdrop-blur-sm"
  >
    <div class="flex flex-col items-center gap-4">
      <div class="animate-pulse">
        <Icon icon={mdiCamera} size="48" class="text-immich-primary dark:text-immich-dark-primary" />
      </div>
      <div class="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-immich-primary dark:bg-immich-dark-primary transition-all duration-300"
          style:width={`${$progress}%`}
        ></div>
      </div>
    </div>
  </div>
{/if}
