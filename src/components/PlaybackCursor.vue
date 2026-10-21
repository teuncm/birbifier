<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
const props = defineProps({ playback: { type: Object, required: true } })
const cursor = ref(null)
let frame, observer, inView = true
function tick() {
  if (!inView || document.hidden) return
  const { context, startedAt, duration } = props.playback
  const progress = Math.max(0, Math.min(1, (context.currentTime - startedAt) / duration))
  const x = String(progress * 720)
  cursor.value.setAttribute('x1', x)
  cursor.value.setAttribute('x2', x)
  if (progress < 1) frame = requestAnimationFrame(tick)
}
function start() {
  cancelAnimationFrame(frame)
  if (cursor.value) tick()
}
watch(() => props.playback, start, { flush: 'post' })
onMounted(() => {
  start()
  observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; start() })
  observer.observe(cursor.value.ownerSVGElement)
  document.addEventListener('visibilitychange', start)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  document.removeEventListener('visibilitychange', start)
})
</script>
<template>
  <line ref="cursor" x1="0" x2="0" y1="0" y2="144" data-playback-cursor stroke="var(--accent)" stroke-width="2" />
</template>
