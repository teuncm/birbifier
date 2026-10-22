<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import AppIcon from './AppIcon.vue'
import FeatherTrail from './FeatherTrail.vue'
import { birdShareUrl } from '../share.js'

const props = defineProps({ settings: { type: Object, required: true }, singing: Boolean, ghost: Boolean, repeat: Boolean, inView: { type: Boolean, default: true } })
const headingId = useId()
const clipId = useId()
const portrait = ref(null)
const portraitFrame = ref(null)
const sharing = ref(false)
const copied = ref(false)
const shareLink = ref('')
const shareInput = ref(null)
let shareTimer
let flight = null
const landingKeys = ['left', 'top', 'width', 'height']
const airborne = ref(false)
const facing = ref(null)
const gaze = ref(null)
let homeRect, homeDirty = true, geometryObserver, dragFrame
function invalidateHome() { homeDirty = true }
function readHome() {
  if (homeDirty || !homeRect) {
    homeRect = portraitFrame.value.getBoundingClientRect()
    homeDirty = false
  }
  return homeRect
}
function paintFlight() {
  const style = portrait.value.style
  style.transform = `translate3d(${flight.x.toFixed(2)}px, ${flight.y.toFixed(2)}px, 0) scale(${(flight.width / flight.baseWidth).toFixed(5)}, ${(flight.height / flight.baseHeight).toFixed(5)})`
}
const returning = ref(false)
let facingLeft = false, lookAngle = 0
const featherTrail = ref(null)
function dropFeather() {
  featherTrail.value?.drop({
    x: flight.left + flight.x + flight.width * 0.45,
    y: flight.top + flight.y + flight.height * 0.6,
    size: Math.max(8, Math.min(14, flight.width * 0.04)),
    color: bird.value.body, vein: bird.value.wing,
  })
}
let pointerId = null, grabX = 0, grabY = 0, returnFrame
let pointerSamples = []
function lookHome(home) {
  const dx = home.left - flight.left - flight.x
  const dy = home.top - flight.top - flight.y
  const nextLeft = Math.abs(dx) > 1 ? dx < 0 : facingLeft
  if (nextLeft !== facingLeft) {
    facingLeft = nextLeft
    if (facingLeft) facing.value.setAttribute('transform', `translate(${bird.value.centerX * 2} 0) scale(-1 1)`)
    else facing.value.removeAttribute('transform')
  }
  const angle = Math.round(Math.max(-25, Math.min(25, Math.atan2(dy, Math.max(1, Math.abs(dx))) * 180 / Math.PI)) * 2) / 2
  if (angle !== lookAngle) {
    lookAngle = angle
    gaze.value.setAttribute('transform', `rotate(${angle} 186 104)`)
  }
}
function startDrag(event) {
  if (props.ghost || event.button !== 0 || pointerId !== null) return
  event.preventDefault()
  const rect = portrait.value.getBoundingClientRect()
  homeDirty = true
  const home = readHome()
  cancelAnimationFrame(returnFrame)
  returning.value = false
  airborne.value = true
  flight = { left: rect.left, top: rect.top, width: rect.width, height: rect.height, baseWidth: rect.width, baseHeight: rect.height, x: 0, y: 0 }
  Object.assign(portrait.value.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, transformOrigin: '0 0', zIndex: '60', willChange: 'transform' })
  paintFlight()
  grabX = event.clientX
  grabY = event.clientY
  pointerId = event.pointerId
  pointerSamples = [{ x: event.clientX, y: event.clientY, time: event.timeStamp }]
  lookHome(home)
  portrait.value.setPointerCapture(pointerId)
}
function drag(event) {
  if (event.pointerId !== pointerId) return
  pointerSamples.push({ x: event.clientX, y: event.clientY, time: event.timeStamp })
  while (pointerSamples.length > 32 || (pointerSamples.length > 2 && pointerSamples[1].time < event.timeStamp - 100)) pointerSamples.shift()
  flight.x = event.clientX - grabX
  flight.y = event.clientY - grabY
  if (dragFrame === undefined) dragFrame = requestAnimationFrame(() => {
    dragFrame = undefined
    if (!flight || pointerId === null) return
    lookHome(readHome())
    paintFlight()
  })
}
function finishReturn() {
  if (!returning.value) return
  cancelAnimationFrame(returnFrame)
  returning.value = false
  flight = null
  airborne.value = false
  portrait.value.removeAttribute('style')
  facing.value.removeAttribute('transform')
  gaze.value.removeAttribute('transform')
  facingLeft = false
  lookAngle = 0
}
function release(event) {
  if (event.pointerId !== pointerId) return
  const lastMovedAt = pointerSamples.at(-1).time
  if (event.type === 'pointerup') drag(event)
  cancelAnimationFrame(dragFrame)
  dragFrame = undefined
  const first = pointerSamples[0], last = pointerSamples.at(-1)
  const elapsed = Math.max(16, last.time - first.time)
  const fresh = event.type === 'pointerup' && event.timeStamp - lastMovedAt < 100
  let vx = fresh ? (last.x - first.x) / elapsed * 1.45 : 0
  let vy = fresh ? (last.y - first.y) / elapsed * 1.45 : 0
  const speed = Math.hypot(vx, vy)
  if (speed > 4.5) { vx *= 4.5 / speed; vy *= 4.5 / speed }
  pointerId = null
  homeDirty = true
  const home = readHome()
  paintFlight()
  returning.value = true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return finishReturn()
  const start = { x: flight.x, y: flight.y }
  const dx = home.left - flight.left - start.x, dy = home.top - flight.top - start.y
  const distance = Math.hypot(dx, dy)
  const bend = dx >= 0 ? -1 : 1
  const arc = Math.min(80, distance * 0.3)
  const arcX = -dy / Math.max(1, distance) * arc * bend
  const arcY = dx / Math.max(1, distance) * arc * bend
  const startedAt = performance.now()
  const landing = { left: home.left, top: home.top, width: home.width, height: home.height }
  let lastFrame = startedAt
  let lastFeather = startedAt - 140
  function fly(now) {
    const progress = Math.min(1, (now - startedAt) / 1800)
    // Refresh cached geometry after scrolling, resizing, or layout changes.
    const target = readHome()
    // Chase a moving perch smoothly instead of jumping when the page scrolls.
    let settled = true
    if (landingKeys.some(key => landing[key] !== target[key])) {
      const follow = 1 - Math.exp(-(now - lastFrame) / 70)
      for (const key of landingKeys) {
        const delta = target[key] - landing[key]
        landing[key] = Math.abs(delta) < 0.1 ? target[key] : landing[key] + delta * follow
        if (Math.abs(landing[key] - target[key]) >= 0.1) settled = false
      }
    }
    lastFrame = now
    const t = progress * progress * (3 - 2 * progress)
    const curve = 16 * progress ** 2 * (1 - progress) ** 2
    const momentum = (now - startedAt) * Math.exp(-(now - startedAt) / 220) * (1 - progress) ** 2
    flight.x = start.x + (landing.left - flight.left - start.x) * t + vx * momentum + arcX * curve
    flight.y = start.y + (landing.top - flight.top - start.y) * t + vy * momentum + arcY * curve
    flight.width += (landing.width - flight.width) * t
    flight.height += (landing.height - flight.height) * t
    lookHome(target)
    paintFlight()
    const left = flight.left + flight.x, top = flight.top + flight.y
    if (distance > 4 && progress < 0.95 && now - lastFeather >= 140 && left < window.innerWidth && left + flight.width > 0 && top < window.innerHeight && top + flight.height > 0) {
      dropFeather()
      lastFeather = now
    }
    if (progress < 1 || !settled) returnFrame = requestAnimationFrame(fly)
    else finishReturn()
  }
  returnFrame = requestAnimationFrame(fly)
}
onMounted(() => {
  if (props.ghost) return
  window.addEventListener('scroll', invalidateHome, { passive: true, capture: true })
  window.addEventListener('resize', invalidateHome, { passive: true })
  geometryObserver = new ResizeObserver(invalidateHome)
  geometryObserver.observe(portraitFrame.value)
  geometryObserver.observe(document.body)
})
onBeforeUnmount(() => {
  clearTimeout(shareTimer)
  cancelAnimationFrame(returnFrame)
  cancelAnimationFrame(dragFrame)
  geometryObserver?.disconnect()
  window.removeEventListener('scroll', invalidateHome, true)
  window.removeEventListener('resize', invalidateHome)
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
  const hue = Math.round(25 + (s.frequency - 250) / 7750 * 310)
  const saturation = 24 + s.cutoff / 15000 * 58
  const radius = 39 + s.amplitude * 32
  const headScale = 0.69 + (s.duration - 0.5) / 1.5 * 0.62
  const tail = 22 + s.vibratoDepth / 1200 * 50
  const beak = 24 + s.pause * 27
  const lift = s.tremoloDepth * 27
  const beakFrequency = s.tremoloDepth > 0.8
    ? s.tremoloFrequency
    : s.vibratoFrequency
  const footBulk = Math.max(0, Math.min(1, s.chorus ?? 0.3))
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
    crest: 7 + s.vibratoFrequency / 30 * 29,
    spread: 3 + s.tremoloFrequency / 30 * 36,
    beak,
    lift,
    footWidth: 2.75 + footBulk * 5.5,
    legWidth: 2.3 + footBulk * 4.4,
    toeLength: 4.75 + footBulk * 5.5,
    stance: 5 + Math.max(0, Math.min(1, (s.cutoff - 250) / 14750)) * 20,
    feathers: 3 + Math.round(s.tremoloFrequency / 30 * 6),
    spots: Array.from({ length: 3 + Math.round(s.tremoloDepth * 11) }, () => ({
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

async function shareBird() {
  if (sharing.value) return
  sharing.value = true
  shareLink.value = ''
  const url = birdShareUrl(props.settings, props.repeat, window.location.href)
  try {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Birbifier', url })
        return
      } catch (cause) {
        if (cause.name === 'AbortError') return
      }
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(url)
      copied.value = true
      clearTimeout(shareTimer)
      shareTimer = setTimeout(() => { copied.value = false }, 1800)
    } catch {
      shareLink.value = url
      await nextTick()
      shareInput.value?.focus()
      shareInput.value?.select()
    }
  } finally { sharing.value = false }
}
</script>

<template>
  <section :class="ghost ? 'overflow-hidden' : 'panel overflow-hidden'" :aria-labelledby="ghost ? undefined : headingId">
    <div v-if="!ghost" class="flex min-h-7 items-center px-2 pt-1">
      <h2 :id="headingId" class="text-sm font-semibold leading-tight">Your bird</h2>
    </div>
    <div :class="$slots.presets ? 'grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center gap-1 px-1 lg:flex lg:flex-col lg:gap-0 lg:px-0' : undefined">
    <!-- Reserve the portrait's space while it flies outside the card. -->
    <div ref="portraitFrame" data-bird-perch class="aspect-[23/20] min-h-0 w-full shrink-0" :class="{ 'min-w-0 lg:order-2': $slots.presets }">
    <svg ref="portrait" v-memo="[bird, singing, repeat, returning, airborne, inView]" xmlns="http://www.w3.org/2000/svg" :viewBox="bird.viewBox" class="block h-full w-full" :class="{ 'bird-draggable': !ghost, 'bird-returning': returning, 'bird-airborne': airborne, 'bird-offscreen': !inView && !airborne }" role="img" :aria-label="ghost ? 'Bird reflection' : 'Bird generated from the current sound parameters'" :data-singing="singing" @pointerdown="startDrag" @pointermove="drag" @pointerup="release" @pointercancel="release" @lostpointercapture="release">
      <defs><clipPath :id="clipId"><path :d="bird.bodyPath" /></clipPath></defs>
      <g ref="facing" data-facing>
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
      <g ref="gaze" data-gaze>
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
      <g data-beak :style="{ '--chirp-beat': bird.beat }">
        <path :d="`M219 120l${bird.beak} -5-${bird.beak} 17Z`" fill="#bf792d" />
      </g>
      </g>
      </g>
      </g>
      </g>
      </g>
    </svg>
    </div>
    <div v-if="$slots.presets" class="min-w-0 px-1 pb-2 lg:order-1 lg:w-full lg:px-3 lg:pb-0">
      <slot name="presets" />
    </div>
    </div>
    <div v-if="!ghost" class="border-t border-line-subtle bg-surface p-2 sm:px-3">
      <div class="flex items-center justify-between gap-2">
        <button class="button-secondary px-3" aria-label="Share bird" :title="copied ? 'Link copied' : 'Share bird'" :disabled="sharing" @click="shareBird"><AppIcon :name="copied ? 'check' : 'share'" :size="16" />{{ copied ? 'Copied' : 'Share' }}</button>
        <button class="icon-button h-9 w-9" aria-label="Download bird SVG" title="Download bird SVG" @click="downloadBird"><AppIcon name="download" :size="16" /></button>
      </div>
      <span role="status" class="sr-only">{{ copied ? 'Bird link copied' : '' }}</span>
      <input v-if="shareLink" ref="shareInput" :value="shareLink" aria-label="Bird share link" readonly class="mt-2 w-full min-w-0 select-text rounded border border-line bg-inset p-1 text-xs" @focus="$event.target.select()" />
    </div>
    <FeatherTrail v-if="!ghost" ref="featherTrail" />
  </section>
</template>

<style>
.bird-draggable { cursor: grab; touch-action: none; }
.bird-draggable:active { cursor: grabbing; }
.bird-returning { pointer-events: none; overflow: visible; }
.bird-airborne [data-ground] { visibility: hidden; }
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
[data-singing="true"] [data-beak] {
  transform-origin: 219px 120px;
  animation: bird-chirp var(--chirp-beat) ease-in-out infinite alternate;
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
.bird-offscreen [data-beak], .bird-offscreen [data-wing], .bird-offscreen [data-tail], .bird-offscreen [data-body] {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  [data-beak], [data-wing], [data-tail], [data-body], [data-legs] { animation: none !important; }
  [data-singing="true"] [data-beak] { transform: rotate(15deg); transform-origin: 219px 120px; }
}
</style>
