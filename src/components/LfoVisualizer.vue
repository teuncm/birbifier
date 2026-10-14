<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ id: String, name: String, speed: Number, depth: Number, maxSpeed: Number, maxDepth: Number, depthStep: Number })
const emit = defineEmits(['update:speed', 'update:depth'])
const dragging = ref(false)
const ratio = computed(() => props.depth / props.maxDepth)
const path = computed(() => Array.from({ length: 601 }, (_, i) => {
  const sine = Math.sin(2 * Math.PI * props.speed * i / 600)
  const y = 52 - sine * ratio.value * 40
  return `${i === 0 ? 'M' : 'L'}${i},${y.toFixed(2)}`
}).join(' '))
const clamp = value => Math.max(0, Math.min(1, value))
function updateFromPointer(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width * 600
  const y = (event.clientY - rect.top) / rect.height * 104
  emit('update:speed', Number((clamp((x - 20) / 560) * props.maxSpeed).toFixed(1)))
  emit('update:depth', Number((Math.round(clamp((92 - y) / 80) * props.maxDepth / props.depthStep) * props.depthStep).toFixed(2)))
}
function start(event) {
  if (event.button !== 0) return
  dragging.value = true
  event.currentTarget.setPointerCapture(event.pointerId)
  event.currentTarget.focus()
  updateFromPointer(event)
}
function keyboard(event) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    emit('update:speed', Number(Math.max(0, Math.min(props.maxSpeed, props.speed + (event.key === 'ArrowRight' ? 0.1 : -0.1))).toFixed(1)))
  } else {
    emit('update:depth', Number(Math.max(0, Math.min(props.maxDepth, props.depth + (event.key === 'ArrowUp' ? props.depthStep : -props.depthStep))).toFixed(2)))
  }
}
</script>
<template>
  <div class="mb-4">
    <svg :id="id" viewBox="0 0 600 104" preserveAspectRatio="none" class="lfo-pad" tabindex="0" role="group" :aria-label="`${name} LFO visualizer`" :aria-describedby="`${id}-help`" @pointerdown="start" @pointermove="dragging && updateFromPointer($event)" @pointerup="dragging = false" @pointercancel="dragging = false" @lostpointercapture="dragging = false" @keydown="keyboard">
      <path d="M0 12H600M0 92H600M150 0V104M300 0V104M450 0V104" stroke="#e0e8d6" stroke-width="1" fill="none" />
      <line x1="0" x2="600" y1="52" y2="52" stroke="#b4c5a4" stroke-width="1" />
      <text x="5" y="48" fill="#737c6d" font-size="10" aria-hidden="true">0</text>
      <path :d="path" stroke="#6c8c50" stroke-width="1.5" fill="none" vector-effect="non-scaling-stroke" />
      <circle :cx="20 + speed / maxSpeed * 560" :cy="92 - ratio * 80" r="5" fill="#355a36" stroke="white" stroke-width="2" />
    </svg>
    <div :id="`${id}-help`" class="mt-1 flex justify-between gap-2 text-[10px] text-muted"><span>Drag: speed → / depth ↑<span class="sr-only">. Arrow keys also adjust speed and depth.</span></span><span>1 second</span></div>
  </div>
</template>
