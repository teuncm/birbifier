<script setup>
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({ settings: { type: Object, required: true }, singing: Boolean, ghost: Boolean, repeat: Boolean })
const headingId = useId()
const clipId = useId()
const portrait = ref(null)
const portraitFrame = ref(null)
const flight = ref(null)
const returning = ref(false)
const facingLeft = ref(false)
const lookAngle = ref(0)
const feathers = ref([])
const featherTimers = new Map()
let featherId = 0
function removeFeather(id) {
  clearTimeout(featherTimers.get(id))
  featherTimers.delete(id)
  feathers.value = feathers.value.filter(feather => feather.id !== id)
}
function dropFeather() {
  if (feathers.value.length >= 16) removeFeather(feathers.value[0].id)
  const id = ++featherId
  feathers.value.push({
    id, x: flight.value.left + flight.value.x + flight.value.width * 0.45,
    y: flight.value.top + flight.value.y + flight.value.height * 0.6,
    size: Math.max(8, Math.min(14, flight.value.width * 0.04)),
    color: bird.value.body, vein: bird.value.wing,
    drift: `${(id % 2 ? 1 : -1) * (14 + id % 4 * 6)}px`,
    turn: `${(id % 2 ? 1 : -1) * (65 + id % 3 * 25)}deg`,
  })
  featherTimers.set(id, setTimeout(() => removeFeather(id), 1400))
}
let pointerId = null, grabX = 0, grabY = 0, returnFrame
function lookHome(home) {
  const dx = home.left - flight.value.left - flight.value.x
  const dy = home.top - flight.value.top - flight.value.y
  if (Math.abs(dx) > 1) facingLeft.value = dx < 0
  lookAngle.value = Math.max(-25, Math.min(25, Math.atan2(dy, Math.max(1, Math.abs(dx))) * 180 / Math.PI))
}
function startDrag(event) {
  if (props.ghost || event.button !== 0 || pointerId !== null) return
  event.preventDefault()
  const rect = portrait.value.getBoundingClientRect()
  cancelAnimationFrame(returnFrame)
  returning.value = false
  flight.value = { left: rect.left, top: rect.top, width: rect.width, height: rect.height, x: 0, y: 0 }
  grabX = event.clientX
  grabY = event.clientY
  pointerId = event.pointerId
  lookHome(portraitFrame.value.getBoundingClientRect())
  portrait.value.setPointerCapture(pointerId)
}
function drag(event) {
  if (event.pointerId !== pointerId) return
  flight.value = { ...flight.value, x: event.clientX - grabX, y: event.clientY - grabY }
  lookHome(portraitFrame.value.getBoundingClientRect())
}
function finishReturn() {
  if (!returning.value) return
  cancelAnimationFrame(returnFrame)
  returning.value = false
  flight.value = null
  facingLeft.value = false
  lookAngle.value = 0
}
function release(event) {
  if (event.pointerId !== pointerId) return
  pointerId = null
  const home = portraitFrame.value.getBoundingClientRect()
  returning.value = true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return finishReturn()
  const start = { x: flight.value.x, y: flight.value.y }
  const end = { x: home.left - flight.value.left, y: home.top - flight.value.top }
  const dx = end.x - start.x, dy = end.y - start.y
  const distance = Math.hypot(dx, dy)
  const bend = dx >= 0 ? -1 : 1
  const arc = Math.min(80, distance * 0.3)
  const control = {
    x: (start.x + end.x) / 2 - dy / Math.max(1, distance) * arc * bend,
    y: (start.y + end.y) / 2 + dx / Math.max(1, distance) * arc * bend,
  }
  const startedAt = performance.now()
  let lastFeather = startedAt - 140
  function fly(now) {
    const progress = Math.min(1, (now - startedAt) / 1800)
    // Ease along a quadratic arc, with a gentle takeoff and landing.
    const t = progress * progress * (3 - 2 * progress)
    const u = 1 - t
    flight.value = { ...flight.value,
      x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
      y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
    }
    lookHome(home)
    if (distance > 4 && progress < 0.95 && now - lastFeather >= 140) {
      dropFeather()
      lastFeather = now
    }
    if (progress < 1) returnFrame = requestAnimationFrame(fly)
    else finishReturn()
  }
  returnFrame = requestAnimationFrame(fly)
}
const flightStyle = computed(() => flight.value ? {
  position: 'fixed', left: `${flight.value.left}px`, top: `${flight.value.top}px`,
  width: `${flight.value.width}px`, height: `${flight.value.height}px`, zIndex: 60,
  transform: `translate3d(${flight.value.x}px, ${flight.value.y}px, 0)`,
} : undefined)
onBeforeUnmount(() => {
  cancelAnimationFrame(returnFrame)
  for (const timer of featherTimers.values()) clearTimeout(timer)
})
const bird = computed(() => {
  const s = props.settings
  // Seed decorative details from the sound: revisiting a preset restores its bird.
  let seed = 2166136261
  for (const char of JSON.stringify(Object.keys(s).sort().map(key => [key, s[key]]))) {
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0
  }
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const hue = Math.round(25 + (s.frequency - 300) / 7700 * 310)
  const saturation = 27 + s.cutoff / 15000 * 52
  const radius = 41 + s.amplitude * 28
  const headScale = 0.72 + (s.duration - 0.5) / 1.5 * 0.56
  const tail = 24 + s.vibratoDepth / 1200 * 46
  const beak = 25 + s.pause * 24
  const lift = s.tremoloDepth * 24
  const beakFrequency = s.tremoloDepth > 0.8
    ? Math.min(s.tremoloFrequency, s.vibratoFrequency)
    : s.vibratoFrequency
  const footBulk = Math.max(0, Math.min(1, ((s.chorus ?? 0.3) - 0.3) / 0.2))
  // Keep exaggerated crests, beaks, and long tails inside the portrait.
  const left = Math.min(12, 94 - tail - 8)
  const top = Math.min(8, 104 - 84 * headScale - lift - 5)
  const right = Math.max(288, 186 + (33 + beak) * headScale + 8)
  const bodyPath = s.shape === 'sine'
    ? `M${152 - radius} 145a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0Z`
    : s.shape === 'square'
      ? `M${152 - radius} ${145 - radius}h${radius * 2}v${radius * 2}h${-radius * 2}Z`
      : `M152 ${145 - radius}L${152 + radius} ${145 + radius}H${152 - radius}Z`
  return {
    bodyPath,
    headScale,
    viewBox: `${left} ${top} ${right - left} ${240 - top}`,
    centerX: (left + right) / 2,
    body: `hsl(${hue} ${saturation}% 55%)`,
    wing: `hsl(${hue + 18} ${saturation}% 34%)`,
    belly: `hsl(${hue - 12} 55% 85%)`,
    accent: `hsl(${hue + 155} 65% 60%)`,
    width: radius,
    height: radius,
    tail,
    crest: 8 + s.vibratoFrequency / 30 * 26,
    spread: 5 + s.tremoloFrequency / 30 * 32,
    beak,
    lift,
    footWidth: 3 + footBulk * 5,
    legWidth: 2.5 + footBulk * 4,
    toeLength: 5 + footBulk * 5,
    stance: 6 + Math.max(0, Math.min(1, (s.cutoff - 300) / 14700)) * 18,
    feathers: 3 + Math.round(s.tremoloFrequency / 30 * 6),
    spots: Array.from({ length: 3 + Math.round(s.tremoloDepth * 10) }, () => ({
      x: 128 + random() * 35, y: 136 + random() * 36, r: 1.5 + random() * 2.5,
    })),
    beat: `${0.5 / Math.max(2, Math.min(20, beakFrequency))}s`,
  }
})

function downloadBird() {
  const svg = portrait.value.cloneNode(true)
  // Export a static, standalone portrait, even during playback.
  svg.querySelector('[data-beak]').removeAttribute('style')
  svg.setAttribute('data-singing', 'false')
  svg.removeAttribute('style')
  svg.removeAttribute('class')
  svg.querySelector('[data-facing]').removeAttribute('transform')
  svg.querySelector('[data-gaze]').removeAttribute('transform')
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'birbifier-bird.svg'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>

<template>
  <section :class="ghost ? 'overflow-hidden' : 'panel overflow-hidden'" :aria-labelledby="ghost ? undefined : headingId">
    <div v-if="!ghost" class="flex min-h-7 items-center justify-between gap-2 px-2 pt-1">
      <h2 :id="headingId" class="text-sm font-semibold leading-tight">Your bird</h2>
      <button class="icon-button h-7 w-7 border-0" aria-label="Download bird SVG" title="Download bird SVG" @click="downloadBird"><AppIcon name="download" :size="16" /></button>
    </div>
    <!-- Reserve the portrait's space while it flies outside the card. -->
    <div ref="portraitFrame" class="aspect-[23/20] w-full">
    <svg ref="portrait" xmlns="http://www.w3.org/2000/svg" :viewBox="bird.viewBox" class="block h-full w-full" :class="{ 'bird-draggable': !ghost, 'bird-returning': returning }" :style="flightStyle" role="img" :aria-label="ghost ? 'Bird reflection' : 'Bird generated from the current sound parameters'" :data-singing="singing" @pointerdown="startDrag" @pointermove="drag" @pointerup="release" @pointercancel="release" @lostpointercapture="release">
      <defs><clipPath :id="clipId"><path :d="bird.bodyPath" /></clipPath></defs>
      <g data-facing :transform="facingLeft ? `translate(${bird.centerX * 2} 0) scale(-1 1)` : undefined">
      <ellipse data-ground cx="160" cy="227" rx="81" ry="8" fill="#edf3e3" />
      <g data-legs stroke="#665541" stroke-width="4" stroke-linecap="round" fill="none">
        <path :stroke-width="bird.legWidth" :d="`M143 ${150 - bird.lift}L${157 - bird.stance} 220M172 ${150 - bird.lift}L${157 + bird.stance} 220`" />
        <path data-feet :stroke-width="bird.footWidth" :d="`M${157 - bird.stance - bird.toeLength} 223L${157 - bird.stance} 220l${bird.toeLength} 3M${157 + bird.stance - bird.toeLength} 223L${157 + bird.stance} 220l${bird.toeLength} 3`" />
      </g>
      <g :transform="`translate(0 ${-bird.lift})`">
      <g data-body>
      <g data-tail :fill="bird.wing">
        <path v-for="i in 3" :key="i" :transform="`rotate(${(i - 2) * bird.spread} 116 158)`" :d="`M116 163Q${77 - bird.tail} 148 ${94 - bird.tail} 158L132 150Z`" />
      </g>
      <path data-torso :d="bird.bodyPath" :fill="bird.body" />
      <g :clip-path="`url(#${clipId})`">
      <ellipse cx="169" cy="163" :rx="bird.width * 0.6" :ry="bird.height * 0.65" :fill="bird.belly" />
      <circle v-for="(spot, i) in bird.spots" :key="i" :cx="spot.x + 24" :cy="spot.y + 11" :r="spot.r" :fill="bird.body" />
      </g>
      <g :clip-path="returning ? undefined : `url(#${clipId})`">
      <g data-wing>
      <path d="M105 139Q142 116 163 150Q154 190 116 179Z" :fill="bird.wing" />
      <path v-for="i in bird.feathers" :key="i" :d="`M${114 + i * 5} 149q14 9 4 21`" fill="none" :stroke="bird.body" stroke-width="2" stroke-linecap="round" />
      </g>
      </g>
      <g data-gaze :transform="flight ? `rotate(${lookAngle} 186 104)` : undefined">
      <g data-head :transform="`translate(186 104) scale(${bird.headScale}) translate(-186 -104)`">
      <g data-crest :fill="bird.wing">
        <path :transform="`rotate(${-bird.spread} 180 84)`" :d="`M174 86Q162 ${68 - bird.crest} 174 ${60 - bird.crest}Q185 ${66 - bird.crest} 185 88Z`" />
        <path :transform="`rotate(${bird.spread} 184 84)`" :d="`M180 88Q181 ${62 - bird.crest} 194 ${60 - bird.crest}Q199 66 190 88Z`" />
      </g>
      <circle cx="186" cy="104" r="39" :fill="bird.body" />
      <ellipse cx="200" cy="113" rx="18" ry="20" :fill="bird.belly" />
      <circle cx="202" cy="99" r="6" fill="#293327" />
      <circle cx="204" cy="97" r="2" fill="white" />
      <ellipse cx="199" cy="120" rx="7" ry="4" :fill="bird.accent" />
      <circle v-if="repeat" data-face-mark cx="189" cy="112" r="1.5" :fill="bird.wing" opacity="0.65" />
      <path :d="`M219 104l${bird.beak} 11-${bird.beak} 5Z`" fill="#dc9c3b" />
      <g data-beak :style="singing ? { transformOrigin: '219px 120px', animation: `bird-chirp ${bird.beat} ease-in-out infinite alternate` } : undefined">
        <path :d="`M219 120l${bird.beak} -5-${bird.beak} 17Z`" fill="#bf792d" />
      </g>
      </g>
      </g>
      </g>
      </g>
      </g>
    </svg>
    </div>
    <Teleport v-if="!ghost" to="body">
      <svg v-for="feather in feathers" :key="feather.id" class="feather-particle pointer-events-none fixed z-50" viewBox="0 0 16 24" :width="feather.size" :height="feather.size * 1.5" :style="{ left: `${feather.x}px`, top: `${feather.y}px`, '--feather-drift': feather.drift, '--feather-turn': feather.turn }" aria-hidden="true" @animationend="removeFeather(feather.id)">
        <path d="M3 20C-3 9 8-2 13 1c7 6-1 18-10 19Z" :fill="feather.color" />
        <path d="M2 23 11 5M5 16l5-1M7 11l-1-4" fill="none" :stroke="feather.vein" stroke-width="1" stroke-linecap="round" />
      </svg>
    </Teleport>
  </section>
</template>

<style>
.feather-particle { animation: feather-fall 1200ms ease-out forwards; }
@keyframes feather-fall {
  0% { opacity: 0.8; transform: translate(0, 0) rotate(-15deg); }
  45% { opacity: 0.65; }
  100% { opacity: 0; transform: translate(var(--feather-drift), 65px) rotate(var(--feather-turn)); }
}
.bird-draggable { cursor: grab; touch-action: none; }
.bird-draggable:active { cursor: grabbing; }
.bird-returning { pointer-events: none; overflow: visible; }
.bird-returning [data-ground] { visibility: hidden; }
.bird-returning [data-legs] {
  transform-origin: 157px 150px;
  animation: bird-leg-wiggle 140ms ease-in-out infinite alternate;
}
@keyframes bird-leg-wiggle {
  from { transform: rotate(-7deg); }
  to { transform: rotate(7deg); }
}
@keyframes bird-chirp {
  from { transform: rotate(0deg); }
  to { transform: rotate(25deg); }
}
[data-singing="true"] [data-wing] {
  transform-origin: 112px 142px;
  animation: bird-flutter 180ms ease-in-out infinite alternate;
}
.bird-returning [data-wing] {
  transform-origin: 112px 142px;
  animation: bird-flight-flap 110ms ease-in-out infinite alternate;
}
@keyframes bird-flight-flap {
  from { transform: rotate(-65deg) scale(1.2, 0.8); }
  to { transform: rotate(55deg) scale(1.15, 1.3); }
}
[data-singing="true"] [data-tail],
.bird-returning [data-tail] {
  transform-origin: 116px 160px;
  animation: bird-tail-flick 270ms ease-in-out infinite alternate;
}
[data-singing="true"] [data-body] {
  transform-origin: 152px 195px;
  animation: bird-bob 420ms ease-in-out infinite alternate;
}
@keyframes bird-flutter {
  from { transform: rotate(-12deg); }
  to { transform: rotate(16deg); }
}
@keyframes bird-tail-flick {
  from { transform: rotate(-5deg); }
  to { transform: rotate(7deg); }
}
@keyframes bird-bob {
  from { transform: translateY(0) rotate(-1deg); }
  to { transform: translateY(-2px) rotate(1deg); }
}
@media (prefers-reduced-motion: reduce) {
  [data-beak], [data-wing], [data-tail], [data-body], [data-legs] { animation: none !important; }
  [data-singing="true"] [data-beak] { transform: rotate(15deg); transform-origin: 219px 120px; }
}
</style>
