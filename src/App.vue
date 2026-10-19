<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import AppIcon from './components/AppIcon.vue'
import RangeControl from './components/RangeControl.vue'
import ParameterLock from './components/ParameterLock.vue'
import LfoVisualizer from './components/LfoVisualizer.vue'
import ControlGroup from './components/ControlGroup.vue'
import PlaybackCursor from './components/PlaybackCursor.vue'
import PresetSelector from './components/PresetSelector.vue'
import BirdPortrait from './components/BirdPortrait.vue'
import { createVoice, defaultSettings, presets, renderSong, toWav } from './audio.js'
import { randomizeSettings } from './randomize.js'
import { useBirdReflection } from './useBirdReflection.js'

const initialPresetIndex = Math.floor(Math.random() * presets.length)
const settings = reactive({ ...presets[initialPresetIndex].settings })
const mainBird = ref(null)
const reflection = useBirdReflection(settings, mainBird)
const locks = reactive(Object.fromEntries(Object.keys(defaultSettings).map(key => [key, false])))
const allLocked = computed(() => Object.values(locks).every(Boolean))
const expanded = reactive({ wave: true, vibrato: true, tremolo: true, timing: true, filter: true })
const anyExpanded = computed(() => Object.values(expanded).some(Boolean))
const playing = ref(false)
const starting = ref(false)
const loop = ref(true)
const repeatGlow = ref(false)
const playHint = ref(true)
const waiting = ref(false)
const lastPresetIndex = ref(initialPresetIndex)
const error = ref('')
const exporting = ref(false)
const playback = shallowRef(null)
const bars = shallowRef([])
const previewBusy = ref(false)
const activePreset = computed({
  get: () => presets.find(preset => Object.keys(settings).every(key => settings[key] === preset.settings[key]))?.name || '',
  set: name => {
    const preset = presets.find(preset => preset.name === name)
    if (preset) applyPreset(preset)
  },
})
let context, voice, repeatTimer, previewTimer, previewRunning = false, previewQueued = false, gapStartedAt = 0, previewVersion = 0, playbackVersion = 0, disposed = false

function restartIfActive() {
  if (playing.value || starting.value) void startPlayback()
}
function applyPreset(preset, restart = true) {
  lastPresetIndex.value = presets.indexOf(preset)
  Object.assign(settings, preset.settings)
  if (restart) restartIfActive()
}
function browsePreset(direction) {
  const matchedIndex = presets.findIndex(preset => preset.name === activePreset.value)
  const index = matchedIndex < 0 ? lastPresetIndex.value : matchedIndex
  applyPreset(presets[(index + direction + presets.length) % presets.length], false)
  void startPlayback()
}
function randomize() {
  Object.assign(settings, randomizeSettings(settings, locks))
  restartIfActive()
}
function toggleAllControls() {
  const next = !anyExpanded.value
  Object.keys(expanded).forEach(key => { expanded[key] = next })
}
function stop() {
  repeatGlow.value = false
  playbackVersion++
  playing.value = false
  starting.value = false
  waiting.value = false
  clearTimeout(repeatTimer)
  playback.value = null
  voice?.stop()
  voice = undefined
}
function scheduleRepeat() {
  clearTimeout(repeatTimer)
  const version = playbackVersion
  const remaining = Math.max(0, settings.pause * 1000 - (performance.now() - gapStartedAt))
  repeatTimer = setTimeout(() => {
    if (version !== playbackVersion || !playing.value || !loop.value || disposed) return
    playOscillator()
    repeatGlow.value = true
  }, remaining)
}
function playOscillator() {
  waiting.value = false
  const version = playbackVersion
  const startedAt = context.currentTime
  const duration = settings.duration
  playback.value = { context, startedAt, duration }
  voice = createVoice(context, { ...settings }, context.destination, () => {
    if (version !== playbackVersion) return
    voice = undefined
    playback.value = null
    if (playing.value && loop.value) {
      waiting.value = true
      gapStartedAt = performance.now()
      scheduleRepeat()
    } else playing.value = false
  })
}
function togglePlayback() {
  if (playing.value || starting.value) return stop()
  return startPlayback()
}
function playbackShortcut(event) {
  if (event.code !== 'Space' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return
  if (event.target.closest?.('button, input, select, textarea, a[href], [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return
  event.preventDefault()
  if (!event.repeat) void togglePlayback()
}
async function startPlayback() {
  playHint.value = false
  stop()
  const version = playbackVersion
  error.value = ''
  starting.value = true
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) throw new Error('This browser does not support audio synthesis. Try a recent browser.')
    context ||= new AudioContext()
    await context.resume()
    if (disposed || version !== playbackVersion) return
    playing.value = true
    playOscillator()
  } catch (cause) {
    if (disposed || version !== playbackVersion) return
    stop()
    error.value = cause.message || 'Audio could not start. Please try again.'
  } finally { if (version === playbackVersion) starting.value = false }
}
async function updatePreview() {
  if (disposed) return
  // Offline rendering cannot be cancelled. Keep at most one preview in flight,
  // then render the latest settings instead of every intermediate drag position.
  if (previewRunning) { previewQueued = true; return }
  previewRunning = true
  previewQueued = false
  const version = ++previewVersion
  previewBusy.value = true
  try {
    const buffer = await renderSong({ ...settings })
    if (disposed || version !== previewVersion) return
    const samples = buffer.getChannelData(0)
    bars.value = Array.from({ length: 180 }, (_, i) => {
      const from = Math.floor(i * samples.length / 180)
      const to = Math.floor((i + 1) * samples.length / 180)
      let peak = 0
      for (let j = from; j < to; j++) peak = Math.max(peak, Math.abs(samples[j]))
      return Math.max(1, peak * 600)
    })
  } catch { if (version === previewVersion) bars.value = [] }
  finally {
    previewRunning = false
    if (version === previewVersion) previewBusy.value = false
    if (previewQueued && !disposed) {
      clearTimeout(previewTimer)
      void updatePreview()
    }
  }
}
async function download() {
  exporting.value = true
  error.value = ''
  try {
    const buffer = await renderSong({ ...settings })
    const url = URL.createObjectURL(toWav(buffer))
    const link = document.createElement('a')
    link.href = url
    link.download = 'birbifier-song.wav'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (cause) { error.value = cause.message || 'Could not export your song.' }
  finally { exporting.value = false }
}
watch(() => Object.keys(defaultSettings).filter(key => key !== 'pause').map(key => settings[key]), () => {
  voice?.update(settings)
  // Invalidate in-flight renders, then debounce work while dragging.
  previewVersion++
  clearTimeout(previewTimer)
  previewTimer = setTimeout(updatePreview, 100)
})
watch(() => settings.pause, () => { if (waiting.value) scheduleRepeat() })
watch(loop, enabled => {
  if (!enabled) {
    repeatGlow.value = false
    if (waiting.value) stop()
  }
})
onMounted(() => {
  window.addEventListener('keydown', playbackShortcut)
  void updatePreview()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', playbackShortcut)
  disposed = true
  previewVersion++
  clearTimeout(previewTimer)
  stop()
  void context?.close()
})
</script>

<template>
  <div class="mx-auto max-w-[1160px] px-3 sm:px-8">
    <header class="flex h-16 items-center justify-between border-b border-line">
      <a href="./" class="flex items-center gap-3 text-xl font-bold tracking-tight" aria-label="Birbifier home">
        <img src="/birb.svg" width="38" height="38" alt="" />Birbifier
      </a>
    </header>
    <main class="py-4 lg:py-6" @pointerdown.capture="reflection.rememberControl" @keydown.capture="reflection.rememberControl" @input.capture="reflection.rememberControl" @change.capture="reflection.rememberControl">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">Birdsong synthesizer</h1>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button class="button-secondary" :disabled="allLocked" title="Randomize unlocked parameters" @click="randomize"><AppIcon name="dice" :size="16" />Randomize</button>
          <button class="button-secondary border-red-300 bg-red-50 text-red-700 hover:bg-red-100" @click="applyPreset(presets[0])"><AppIcon name="reset" :size="16" />Reset sound</button>
          <button class="button-secondary" :aria-expanded="anyExpanded" aria-controls="wave-controls vibrato-controls tremolo-controls timing-controls filter-controls" @click="toggleAllControls"><AppIcon :name="anyExpanded ? 'up' : 'down'" :size="16" />{{ anyExpanded ? 'Collapse all' : 'Expand all' }}</button>
        </div>
      </div>
      <div class="grid grid-cols-2 items-start gap-3 lg:grid-cols-[1fr_320px] lg:grid-rows-[auto_auto_1fr]">
        <div class="contents lg:col-start-1 lg:row-start-1 lg:row-span-3 lg:block lg:min-w-0 lg:space-y-3">
          <section class="panel col-span-2 row-start-2 overflow-hidden" aria-labelledby="preview-heading">
            <div class="min-w-0">
            <div class="flex items-center justify-between px-3 pt-1">
              <h2 id="preview-heading" class="flex min-h-7 items-center gap-2 text-sm font-semibold leading-tight"><AppIcon name="wave" :size="17" />Waveform</h2>
            </div>
            <div class="relative mx-3 mt-2 h-24 overflow-hidden rounded-lg bg-[#f7f9f4] lg:h-28" :aria-busy="previewBusy">
              <svg viewBox="0 0 720 144" preserveAspectRatio="none" class="h-full w-full" role="img" aria-label="Waveform preview of the current song">
                <defs><pattern id="grid" width="60" height="36" patternUnits="userSpaceOnUse"><path d="M60 0H0V36" fill="none" stroke="#dae3d0" stroke-width="1" /></pattern></defs>
                <rect width="720" height="144" fill="url(#grid)" />
                <path d="M0 72H720" stroke="#acbf9b" stroke-width="1" />
                <line v-for="(height, i) in bars" :key="i" :x1="i * 4 + 2" :x2="i * 4 + 2" :y1="72 - height / 2" :y2="72 + height / 2" stroke="#628247" stroke-width="2" stroke-linecap="round" />
                <PlaybackCursor v-if="playback" :playback="playback" />
              </svg>
              <span v-if="!bars.length" class="absolute inset-0 flex items-center justify-center text-xs text-muted">{{ previewBusy ? 'Rendering…' : 'Preview unavailable' }}</span>
            </div>
            <div class="mx-3 mt-2 flex justify-between font-mono text-[10px] text-muted "><span>0.00 s</span><span class="hidden sm:inline">{{ (settings.duration / 2).toFixed(2) }} s</span><span>{{ settings.duration.toFixed(2) }} s</span></div>
            </div>
            <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#fcfdf9] px-3 py-3 ">
              <div class="flex flex-wrap items-center gap-2 lg:gap-3">
                <button class="button-primary" :class="{ 'play-attention': playHint }" :disabled="starting" :aria-label="starting ? 'Starting…' : playing ? 'Stop song' : 'Play song'" :title="starting ? 'Starting…' : playing ? 'Stop song' : 'Play song'" @animationend="playHint = false" @click="togglePlayback"><AppIcon :name="playing ? 'stop' : 'play'" :size="18" /></button>
                <button class="repeat-button px-4" :class="{ selected: loop, 'repeat-glow': repeatGlow }" :aria-pressed="loop" aria-label="Repeat song" :title="loop ? 'Repeat on' : 'Repeat off'" @animationend="repeatGlow = false" @click="loop = !loop"><AppIcon name="repeat" :size="18" /></button>
                <button class="repeat-button px-4" :disabled="exporting" :aria-busy="exporting" aria-label="Download (WAV)" :title="exporting ? 'Saving…' : 'Download (WAV)'" @click="download"><AppIcon name="download" :size="18" /></button>
              </div>
              <span class="flex items-center gap-2 text-xs text-muted" role="status" aria-label="Playback status"><span class="h-1.5 w-1.5 rounded-full" :class="playing ? 'bg-moss' : 'bg-[#9ba88f]'"></span>{{ waiting ? 'Pause' : playing ? 'Playing' : 'Ready' }}</span>
            </div>
          </section>
          <section class="panel col-span-2 row-start-3 p-3" aria-labelledby="synth-heading">
            <h2 id="synth-heading" class="mb-2 text-sm font-semibold leading-tight">Synth</h2>
            <div class="space-y-3">
            <ControlGroup id="wave-controls" title="Wave" :expanded="expanded.wave" @toggle="expanded.wave = !expanded.wave">
            <fieldset>
              <legend class="w-full text-sm font-medium" :class="{ 'mb-2': expanded.wave }"><span class="flex items-center justify-between">Wave shape<span class="flex items-center gap-1"><output v-if="!expanded.wave" class="value-readout" aria-label="Wave shape" data-parameter="shape">{{ settings.shape === 'saw' ? 'Sawtooth' : settings.shape === 'sine' ? 'Sine' : 'Square' }}</output><ParameterLock :locked="locks.shape" label="Wave shape" @toggle="locks.shape = !locks.shape" /></span></span></legend>
              <div v-if="expanded.wave" class="grid grid-cols-3 gap-2">
                <button v-for="shape in ['sine', 'square', 'saw']" :key="shape" class="shape-button" :class="{ selected: settings.shape === shape }" :aria-pressed="settings.shape === shape" @click="settings.shape = shape">
                  <svg viewBox="0 0 48 22" class="h-5 w-10" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path :d="shape === 'sine' ? 'M1 11C9-3 15-3 24 11S39 25 47 11' : shape === 'square' ? 'M1 18V4H24V18H47V4' : 'M1 18 23 4V18L47 4'" /></svg>
                  <span>{{ shape === 'saw' ? 'Sawtooth' : shape === 'sine' ? 'Sine' : 'Square' }}</span>
                </button>
              </div>
            </fieldset>
            <div class="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <RangeControl id="frequency" v-model="settings.frequency" label="Wave speed" :min="100" :max="8000" :step="10" unit="Hz" min-label="100 Hz" max-label="8 kHz" :locked="locks.frequency" :expanded="expanded.wave" @toggle-lock="locks.frequency = !locks.frequency" />
              <RangeControl id="amplitude" v-model="settings.amplitude" label="Amplitude" :min="0" :max="1" :step="0.01" :scale="100" unit="%" :locked="locks.amplitude" :expanded="expanded.wave" @toggle-lock="locks.amplitude = !locks.amplitude" />
            </div>
            </ControlGroup>
            <ControlGroup id="vibrato-controls" title="Vibrato" caption="Pitch LFO" :expanded="expanded.vibrato" @toggle="expanded.vibrato = !expanded.vibrato">
              <LfoVisualizer v-if="expanded.vibrato" id="vibrato-lfo" name="Vibrato" v-model:speed="settings.vibratoSpeed" v-model:depth="settings.vibratoDepth" :max-speed="40" :max-depth="1200" :depth-step="10" />
              <div class="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <RangeControl id="vibrato-speed" v-model="settings.vibratoSpeed" label="Speed" lock-label="Vibrato speed" :min="0" :max="40" :step="0.1" unit="Hz" :locked="locks.vibratoSpeed" :expanded="expanded.vibrato" @toggle-lock="locks.vibratoSpeed = !locks.vibratoSpeed" />
                <RangeControl id="vibrato-depth" v-model="settings.vibratoDepth" label="Depth" lock-label="Vibrato depth" :min="0" :max="1200" :step="10" unit="cents" :locked="locks.vibratoDepth" :expanded="expanded.vibrato" @toggle-lock="locks.vibratoDepth = !locks.vibratoDepth" />
              </div>
            </ControlGroup>
            <ControlGroup id="tremolo-controls" title="Tremolo" caption="Volume LFO" :expanded="expanded.tremolo" @toggle="expanded.tremolo = !expanded.tremolo">
              <LfoVisualizer v-if="expanded.tremolo" id="tremolo-lfo" name="Tremolo" v-model:speed="settings.tremoloSpeed" v-model:depth="settings.tremoloDepth" :max-speed="30" :max-depth="1" :depth-step="0.01" />
              <div class="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <RangeControl id="tremolo-speed" v-model="settings.tremoloSpeed" label="Speed" lock-label="Tremolo speed" :min="0" :max="30" :step="0.1" unit="Hz" :locked="locks.tremoloSpeed" :expanded="expanded.tremolo" @toggle-lock="locks.tremoloSpeed = !locks.tremoloSpeed" />
                <RangeControl id="tremolo-depth" v-model="settings.tremoloDepth" label="Depth" lock-label="Tremolo depth" :min="0" :max="1" :step="0.01" :scale="100" unit="%" :locked="locks.tremoloDepth" :expanded="expanded.tremolo" @toggle-lock="locks.tremoloDepth = !locks.tremoloDepth" />
              </div>
            </ControlGroup>
            </div>
          </section>
        </div>
        <PresetSelector class="col-start-2 row-start-1" v-model="activePreset" :presets="presets" @previous="browsePreset(-1)" @next="browsePreset(1)" />
        <BirdPortrait ref="mainBird" class="col-start-1 row-start-1 lg:col-start-2 lg:row-start-2" :settings="settings" :singing="playing && !waiting" :repeat="loop" />
        <aside class="col-span-2 row-start-4 space-y-3 lg:col-span-1 lg:col-start-2 lg:row-start-3">
          <section class="panel space-y-2 p-3" aria-labelledby="master-heading">
          <h2 id="master-heading" class="text-sm font-semibold leading-tight">Master</h2>
          <ControlGroup id="filter-controls" title="Low-pass filter" icon="filter" caption="Global" :expanded="expanded.filter" @toggle="expanded.filter = !expanded.filter">
            <RangeControl id="cutoff" v-model="settings.cutoff" label="Cutoff" :min="200" :max="20000" :step="100" unit="Hz" min-label="200 Hz" max-label="20 kHz" :locked="locks.cutoff" :expanded="expanded.filter" @toggle-lock="locks.cutoff = !locks.cutoff" />
          </ControlGroup>
          <ControlGroup id="timing-controls" title="Timing" icon="repeat" :expanded="expanded.timing" @toggle="expanded.timing = !expanded.timing">
            <RangeControl id="duration" v-model="settings.duration" label="Chirp duration" :min="0.5" :max="2" :step="0.05" unit="s" :locked="locks.duration" :expanded="expanded.timing" @toggle-lock="locks.duration = !locks.duration" />
            <p v-if="expanded.timing" class="mt-3 text-xs text-muted">Applies to the next play.</p>
            <div class="mt-3">
              <RangeControl id="pause" v-model="settings.pause" label="Repeat pause" :min="0" :max="1" :step="0.05" unit="s" :locked="locks.pause" :expanded="expanded.timing" @toggle-lock="locks.pause = !locks.pause" />
            </div>
          </ControlGroup>
          </section>
          <p class="px-1 text-xs text-muted">Locks preserve parameters during randomization.</p>
        </aside>
      </div>
      <p v-if="error" class="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{{ error }}</p>
    </main>
    <Teleport to="body">
        <div v-if="reflection.visible.value" class="bird-reflection pointer-events-none fixed z-50 flex items-center justify-center rounded-full border border-line bg-white/90 p-1 shadow-lg" :style="reflection.style.value" aria-hidden="true">
          <BirdPortrait ghost class="w-full opacity-80" :settings="settings" :singing="playing && !waiting" :repeat="loop" />
        </div>
    </Teleport>
  </div>
</template>
