<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps({ playback: { type: Object, required: true } })
const progress = ref(0)
let frame
function tick() {
  const { context, startedAt, duration } = props.playback
  progress.value = Math.max(0, Math.min(1, (context.currentTime - startedAt) / duration))
  if (progress.value < 1) frame = requestAnimationFrame(tick)
}
// Keep frame updates in this component so controls are not patched by animation.
watch(() => props.playback, () => {
  cancelAnimationFrame(frame)
  tick()
}, { immediate: true })
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>
<template>
  <line :x1="progress * 720" :x2="progress * 720" y1="0" y2="144" data-playback-cursor stroke="var(--accent)" stroke-width="2" />
</template>
