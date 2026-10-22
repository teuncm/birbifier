<script setup>
import { onBeforeUnmount, shallowRef } from 'vue'

const feathers = shallowRef([])
const timers = new Map()
let nextId = 0
function remove(id) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  feathers.value = feathers.value.filter(feather => feather.id !== id)
}
function drop(feather) {
  if (feathers.value.length >= 16) remove(feathers.value[0].id)
  const id = ++nextId
  feathers.value = [...feathers.value, {
    ...feather, id,
    drift: `${(id % 2 ? 1 : -1) * (14 + id % 4 * 6)}px`,
    turn: `${(id % 2 ? 1 : -1) * (65 + id % 3 * 25)}deg`,
  }]
  timers.set(id, setTimeout(() => remove(id), 1400))
}
defineExpose({ drop })
onBeforeUnmount(() => {
  for (const timer of timers.values()) clearTimeout(timer)
})
</script>

<template>
  <Teleport to="body">
    <svg v-for="feather in feathers" :key="feather.id" class="feather-particle pointer-events-none fixed z-50" viewBox="0 0 16 24" :width="feather.size" :height="feather.size * 1.5" :style="{ left: `${feather.x}px`, top: `${feather.y}px`, '--feather-drift': feather.drift, '--feather-turn': feather.turn }" aria-hidden="true" @animationend="remove(feather.id)">
      <path d="M3 20C-3 9 8-2 13 1c7 6-1 18-10 19Z" :fill="feather.color" />
      <path d="M2 23 11 5M5 16l5-1M7 11l-1-4" fill="none" :stroke="feather.vein" stroke-width="1" stroke-linecap="round" />
    </svg>
  </Teleport>
</template>

<style>
.feather-particle { animation: feather-fall 1200ms ease-out forwards; }
@keyframes feather-fall {
  0% { opacity: 0.8; transform: translate(0, 0) rotate(-15deg); }
  45% { opacity: 0.65; }
  100% { opacity: 0; transform: translate(var(--feather-drift), 65px) rotate(var(--feather-turn)); }
}
</style>
