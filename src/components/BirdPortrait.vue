<script setup>
import { computed, ref, useId } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({ settings: { type: Object, required: true }, singing: Boolean, ghost: Boolean })
const headingId = useId()
const clipId = useId()
const portrait = ref(null)
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
  const hue = Math.round(25 + (s.frequency - 100) / 7900 * 290)
  const saturation = 30 + s.cutoff / 20000 * 40
  const radius = 48 + s.amplitude * 11 + (s.duration - 0.5) / 1.5 * 7.5
  const bodyPath = s.shape === 'sine'
    ? `M${152 - radius} 145a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0Z`
    : s.shape === 'square'
      ? `M${152 - radius} ${145 - radius}h${radius * 2}v${radius * 2}h${-radius * 2}Z`
      : `M152 ${145 - radius}L${152 + radius} ${145 + radius}H${152 - radius}Z`
  return {
    bodyPath,
    body: `hsl(${hue} ${saturation}% 55%)`,
    wing: `hsl(${hue + 18} ${saturation}% 34%)`,
    belly: `hsl(${hue - 12} 55% 85%)`,
    accent: `hsl(${hue + 155} 65% 60%)`,
    width: 48 + s.amplitude * 22,
    height: 48 + (s.duration - 0.5) / 1.5 * 15,
    tail: 28 + s.vibratoDepth / 1200 * 40,
    crest: 7 + s.vibratoSpeed / 40 * 23,
    spread: 3 + s.tremoloSpeed / 30 * 25,
    beak: 26 + s.pause * 18,
    lift: s.tremoloDepth * 18,
    feathers: 3 + Math.round(s.tremoloSpeed / 30 * 5),
    spots: Array.from({ length: 3 + Math.round(s.tremoloDepth * 9) }, () => ({
      x: 128 + random() * 35, y: 136 + random() * 36, r: 1.5 + random() * 2,
    })),
    beat: `${0.5 / Math.max(2, Math.min(20, s.vibratoSpeed))}s`,
  }
})

function downloadBird() {
  const svg = portrait.value.cloneNode(true)
  // Export a static, standalone portrait, even during playback.
  svg.querySelector('[data-beak]').removeAttribute('style')
  svg.setAttribute('data-singing', 'false')
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
    <div v-if="!ghost" class="flex min-h-8 items-center justify-between gap-2 px-3 pt-1">
      <h2 :id="headingId" class="text-sm font-semibold leading-5">Your bird</h2>
      <button class="icon-button h-8 w-8 border-0" aria-label="Download bird SVG" title="Download bird SVG" @click="downloadBird"><AppIcon name="download" :size="16" /></button>
    </div>
    <svg ref="portrait" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" class="block w-full" role="img" :aria-label="ghost ? 'Bird reflection' : 'Bird generated from the current sound parameters'" :data-singing="singing">
      <defs><clipPath :id="clipId"><path :d="bird.bodyPath" /></clipPath></defs>
      <ellipse cx="160" cy="227" rx="81" ry="8" fill="#edf3e3" />
      <g stroke="#665541" stroke-width="4" stroke-linecap="round" fill="none">
        <path :d="`M143 ${192 - bird.lift}V220m-8 3 8-3 9 3M172 ${192 - bird.lift}V220m-8 3 8-3 9 3`" />
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
      <g data-wing>
      <path d="M105 139Q142 116 163 150Q154 190 116 179Z" :fill="bird.wing" />
      <path v-for="i in bird.feathers" :key="i" :d="`M${114 + i * 5} 149q14 9 4 21`" fill="none" :stroke="bird.body" stroke-width="2" stroke-linecap="round" />
      </g>
      </g>
      <g data-crest :fill="bird.wing">
        <path :transform="`rotate(${-bird.spread} 180 84)`" :d="`M174 86Q162 ${68 - bird.crest} 174 ${60 - bird.crest}Q185 ${66 - bird.crest} 185 88Z`" />
        <path :transform="`rotate(${bird.spread} 184 84)`" :d="`M180 88Q181 ${62 - bird.crest} 194 ${60 - bird.crest}Q199 66 190 88Z`" />
      </g>
      <circle cx="186" cy="104" r="39" :fill="bird.body" />
      <ellipse cx="200" cy="113" rx="18" ry="20" :fill="bird.belly" />
      <circle cx="202" cy="99" r="6" fill="#293327" />
      <circle cx="204" cy="97" r="2" fill="white" />
      <ellipse cx="199" cy="120" rx="7" ry="4" :fill="bird.accent" />
      <path :d="`M219 104l${bird.beak} 11-${bird.beak} 5Z`" fill="#dc9c3b" />
      <g data-beak :style="singing ? { transformOrigin: '219px 120px', animation: `bird-chirp ${bird.beat} ease-in-out infinite alternate` } : undefined">
        <path :d="`M219 120l${bird.beak} -5-${bird.beak} 17Z`" fill="#bf792d" />
      </g>
      </g>
      </g>
    </svg>
    <p v-if="!ghost" class="hidden px-3 pb-3 text-xs text-muted lg:block">Shaped by your sound.</p>
  </section>
</template>

<style>
@keyframes bird-chirp {
  from { transform: rotate(0deg); }
  to { transform: rotate(25deg); }
}
[data-singing="true"] [data-wing] {
  transform-origin: 112px 142px;
  animation: bird-flutter 180ms ease-in-out infinite alternate;
}
[data-singing="true"] [data-tail] {
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
  [data-beak], [data-wing], [data-tail], [data-body] { animation: none !important; }
  [data-singing="true"] [data-beak] { transform: rotate(15deg); transform-origin: 219px 120px; }
}
</style>
