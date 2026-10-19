<script setup>
defineProps({ name: String, size: { type: Number, default: 20 } })
const paths = {
  play: 'm9 5 11 7-11 7Z', stop: 'M6 6h12v12H6Z',
  reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
  dice: 'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01',
  download: 'M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5',
  repeat: 'm17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3',
  wave: 'M2 12c4-14 6 14 10 0s6 14 10 0',
  sliders: 'M4 5h16M4 12h16M4 19h16M8 2v6m8 1v6m-6 1v6',
  feather: 'M20 4C11-5-1 12 6 18c6 7 22-6 14-14ZM4 21 17 8M7 14h6',
  spark: 'm12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z',
  filter: 'M3 5h18l-7 8v6l-4 2v-8Z',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5ZM12 14v3',
  unlock: 'M7 10V7a5 5 0 0 1 9-3M5 10h14v11H5ZM12 14v3',
  shuffle: 'M3 5h3l12 14h3m-4-4 4 4-4 3M3 19h3l4-5m4-4 4-5h3m-4-3 4 3-4 4',
  left: 'm14 6-6 6 6 6', right: 'm10 6 6 6-6 6',
  up: 'm6 14 6-6 6 6', down: 'm6 10 6 6 6-6',
}
</script>
<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[name] || paths.wave" :fill="name === 'play' || name === 'stop' ? 'currentColor' : 'none'" />
  </svg>
</template>
