<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
const props = defineProps({ id: String, name: String, frequency: Number, depth: Number, maxFrequency: Number, maxDepth: Number, depthStep: Number })
const emit = defineEmits(['update:frequency', 'update:depth'])
const dragging = ref(false)
const pad = ref(null)
let frame, pointerId = null, bounds, pending
function invalidateBounds() { bounds = undefined }
// One-pixel frame plus the dot's radius: the dot can touch every edge.
const inset = 7
const ratio = computed(() => props.depth / props.maxDepth)
// A zero scale makes the SVG transform non-invertible and hides its stroke.
// This minimum is visually flat (under 0.01px), while keeping the path drawable.
const visualRatio = computed(() => Math.max(0.0001, ratio.value))
const sineSamples = computed(() => Float32Array.from({ length: 601 }, (_, i) => Math.sin(2 * Math.PI * props.frequency * i / 600)))
const path = computed(() => Array.from({ length: 601 }, (_, i) => {
  const sine = sineSamples.value[i]
  const y = 52 - sine * 52
  return `${i === 0 ? 'M' : 'L'}${i},${y.toFixed(2)}`
}).join(' '))
const clamp = value => Math.max(0, Math.min(1, value))
function updateFromPointer(point) {
  const rect = bounds ||= pad.value.getBoundingClientRect()
  const x = (point.x - rect.left - inset) / (rect.width - inset * 2)
  const y = (point.y - rect.top - inset) / (rect.height - inset * 2)
  emit('update:frequency', Number((clamp(x) * props.maxFrequency).toFixed(1)))
  emit('update:depth', Number((Math.round(clamp(1 - y) * props.maxDepth / props.depthStep) * props.depthStep).toFixed(2)))
}
function start(event) {
  if (event.button !== 0 || pointerId !== null) return
  pointerId = event.pointerId
  dragging.value = true
  event.currentTarget.setPointerCapture(event.pointerId)
  event.currentTarget.focus()
  invalidateBounds()
  window.addEventListener('scroll', invalidateBounds, { passive: true, capture: true })
  window.addEventListener('resize', invalidateBounds, { passive: true })
  updateFromPointer({ x: event.clientX, y: event.clientY })
}
function move(event) {
  if (event.pointerId !== pointerId) return
  pending = { x: event.clientX, y: event.clientY }
  if (frame !== undefined) return
  frame = requestAnimationFrame(() => {
    frame = undefined
    updateFromPointer(pending)
    pending = undefined
  })
}
function end(event) {
  if (event && event.pointerId !== pointerId) return
  cancelAnimationFrame(frame)
  frame = undefined
  if (event?.type === 'pointerup') updateFromPointer({ x: event.clientX, y: event.clientY })
  pending = undefined
  pointerId = null
  dragging.value = false
  window.removeEventListener('scroll', invalidateBounds, true)
  window.removeEventListener('resize', invalidateBounds)
}
onBeforeUnmount(() => end())
function keyboard(event) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    emit('update:frequency', Number(Math.max(0, Math.min(props.maxFrequency, props.frequency + (event.key === 'ArrowRight' ? 0.1 : -0.1))).toFixed(1)))
  } else {
    emit('update:depth', Number(Math.max(0, Math.min(props.maxDepth, props.depth + (event.key === 'ArrowUp' ? props.depthStep : -props.depthStep))).toFixed(2)))
  }
}
</script>
<template>
  <div class="mb-2">
    <div class="lfo-surface relative" :class="{ 'is-dragging': dragging }">
    <div :id="id" ref="pad" class="lfo-pad relative" tabindex="0" role="group" :aria-label="`${name} LFO visualizer`" :aria-describedby="`${id}-help`" @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown="keyboard">
      <svg viewBox="0 0 600 104" preserveAspectRatio="none" class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <path :d="path" :transform="`translate(0 52) scale(1 ${visualRatio}) translate(0 -52)`" stroke="var(--accent)" stroke-width="1.5" fill="none" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="pointer-events-none absolute" :style="{ inset: `${inset - 1}px` }" aria-hidden="true">
        <span class="lfo-dot absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-moss" :style="{ left: `${frequency / maxFrequency * 100}%`, top: `${(1 - ratio) * 100}%` }"></span>
      </div>
    </div>
    </div>
    <span :id="`${id}-help`" class="sr-only">Drag horizontally to adjust frequency and vertically to adjust depth. Arrow keys also adjust frequency and depth.</span>
  </div>
</template>
