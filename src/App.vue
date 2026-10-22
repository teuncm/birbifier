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
import { createVoice, defaultSettings, presets, renderSong, stopMasterEffects, updateMasterEffects, toWav } from './audio.js'
import { MIN_AMPLITUDE, randomizeSettings } from './randomize.js'
import { buildWaveform } from './waveform.js'
import { useBirdReflection } from './useBirdReflection.js'
import { useControlFeedback } from './useControlFeedback.js'
import { decodeBird } from './share.js'

useControlFeedback()

const sharedBird = decodeBird(new URLSearchParams(window.location.search).get('p'))
const sharedPresetIndex = sharedBird ? presets.findIndex(preset => Object.keys(preset.settings).every(key => preset.settings[key] === sharedBird.settings[key])) : -1
const initialPresetIndex = sharedBird ? Math.max(0, sharedPresetIndex) : Math.floor(Math.random() * presets.length)
const settings = reactive({ ...(sharedBird?.settings || presets[initialPresetIndex].settings) })
const mainBird = ref(null)
const theme = ref(document.documentElement.dataset.theme || 'dark')
const deviceTheme = window.matchMedia('(prefers-color-scheme: dark)')
let followDeviceTheme = document.documentElement.dataset.themePreference === 'system'
function applyTheme(next) {
  theme.value = next
  document.documentElement.dataset.theme = theme.value
  document.querySelector('meta[name="theme-color"]').content = theme.value === 'dark' ? '#191a1b' : '#e1e6d9'
}
function syncDeviceTheme(event) {
  if (followDeviceTheme) applyTheme(event.matches ? 'dark' : 'light')
}
function toggleTheme() {
  followDeviceTheme = false
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  document.documentElement.dataset.themePreference = theme.value
  try { localStorage.setItem('birbifier-theme', theme.value) } catch {}
}
const presetSelector = ref(null)
const reflection = useBirdReflection(settings, mainBird)
const locks = reactive(Object.fromEntries(Object.keys(defaultSettings).map(key => [key, key === 'chorus'])))
const allLocked = computed(() => Object.values(locks).every(Boolean))
const expanded = reactive({ wave: true, vibrato: true, tremolo: true, timing: true, effects: true })
const anyExpanded = computed(() => Object.values(expanded).some(Boolean))
const playing = ref(false)
const starting = ref(false)
const loop = ref(sharedBird?.repeat ?? true)
const repeatGlow = ref(false)
const playHint = ref(true)
const waiting = ref(false)
const lastPresetIndex = ref(initialPresetIndex)
const error = ref('')
const exporting = ref(false)
const downloadButton = ref(null)
const downloadPressed = ref(false)
const playPressed = ref(false)
let downloadPressTimer
let playPressTimer
const playback = shallowRef(null)
const bars = shallowRef([])
const waveformDisplay = ref(null)
let previewObserver, previewVisible = true
const previewBusy = ref(false)
const settingKeys = Object.keys(defaultSettings)
const presetNames = new Map(presets.map(preset => [JSON.stringify(settingKeys.map(key => preset.settings[key])), preset.name]))
const activePreset = computed({
  get: () => presetNames.get(JSON.stringify(settingKeys.map(key => settings[key]))) || '',
  set: name => {
    const preset = presets.find(preset => preset.name === name)
    if (preset) applyPreset(preset)
  },
})
let context, voice, repeatTimer, completionTimer, previewTimer, previewRunning = false, previewQueued = false, gapStartedAt = 0, previewVersion = 0, playbackVersion = 0, disposed = false

function restartIfActive() {
  if (playing.value || starting.value) void startPlayback()
}
function applyPreset(preset, restart = true) {
  lastPresetIndex.value = presets.indexOf(preset)
  Object.assign(settings, preset.settings)
  locks.chorus = true
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
  void startPlayback()
}
function resetSound() {
  stop()
  applyPreset(presets[0], false)
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
  clearTimeout(completionTimer)
  playback.value = null
  voice?.stop()
  stopMasterEffects(context)
  voice = undefined
}
function stopForBackground() {
  stop()
  // Release the audio device as well as cancelling voices and repeat timers.
  // A fresh context is created only after the user presses Play again.
  const previousContext = context
  context = undefined
  void previousContext?.close().catch(() => {})
}
function visibilityChanged() {
  if (document.hidden) {
    stopForBackground()
    clearTimeout(previewTimer)
    previewTimer = undefined
  } else if (previewQueued && previewVisible) void updatePreview()
}
function scheduleRepeat() {
  clearTimeout(repeatTimer)
  const version = playbackVersion
  const remaining = Math.max(0, settings.pause * 1000 - (performance.now() - gapStartedAt))
  repeatTimer = setTimeout(() => {
    if (version !== playbackVersion || !playing.value || !loop.value || disposed) return
    if (document.hidden) return stopForBackground()
    playOscillator()
    repeatGlow.value = true
  }, remaining)
}
function playOscillator() {
  waiting.value = false
  const version = playbackVersion
  let startedAt, duration
  function finish() {
    if (version !== playbackVersion || disposed) return
    // The preview includes the chorus tail. Wait for that audio time as well,
    // and retain the cursor so its final frame can reach the right edge.
    const remaining = startedAt + duration - context.currentTime
    if (remaining > 0) {
      completionTimer = setTimeout(finish, Math.max(4, remaining * 1000))
      return
    }
    if (playing.value && loop.value) {
      waiting.value = true
      gapStartedAt = performance.now()
      scheduleRepeat()
    } else {
      playing.value = false
      stopMasterEffects(context)
    }
  }
  voice = createVoice(context, { ...settings }, context.destination, () => {
    if (version !== playbackVersion) return
    voice = undefined
    finish()
  })
  startedAt = voice.startedAt
  duration = voice.duration
  playback.value = { context, startedAt, duration }
}
function togglePlayback() {
  clearTimeout(playPressTimer)
  playPressed.value = true
  playPressTimer = setTimeout(() => { playPressed.value = false }, 250)
  if (playing.value || starting.value) return stop()
  return startPlayback()
}
function playbackShortcut(event) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return
  if (event.key === 'ArrowDown') {
    if (event.target.closest?.('input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"], .lfo-pad')) return
    event.preventDefault()
    if (!event.repeat && !exporting.value) {
      clearTimeout(downloadPressTimer)
      downloadPressed.value = true
      downloadButton.value?.click()
      downloadPressTimer = setTimeout(() => { downloadPressed.value = false }, 250)
    }
    return
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    if (event.target.closest?.('input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"], .lfo-pad')) return
    event.preventDefault()
    if (!event.repeat) presetSelector.value?.press(event.key === 'ArrowRight' ? 1 : -1)
    return
  }
  if (event.code !== 'Space') return
  if (event.target.closest?.('button, input, select, textarea, a[href], [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return
  event.preventDefault()
  if (!event.repeat) void togglePlayback()
}
async function startPlayback() {
  if (disposed || document.hidden) return
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
    if (document.hidden) return stopForBackground()
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
  if (previewRunning || !previewVisible || document.hidden) { previewQueued = true; return }
  previewRunning = true
  previewQueued = false
  const version = ++previewVersion
  previewBusy.value = true
  try {
    const buffer = await renderSong({ ...settings })
    if (disposed || version !== previewVersion) return
    bars.value = buildWaveform(buffer)
  } catch { if (version === previewVersion) bars.value = [] }
  finally {
    previewRunning = false
    if (version === previewVersion) previewBusy.value = false
    if (previewQueued && previewTimer === undefined && !disposed && previewVisible && !document.hidden) {
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
const soundKeys = Object.keys(defaultSettings).filter(key => key !== 'pause')
watch(() => soundKeys.map(key => settings[key]), () => {
  if (voice) voice.update(settings)
  else updateMasterEffects(context, settings)
  // Invalidate in-flight renders, then debounce work while dragging.
  previewVersion++
  previewQueued = true
  clearTimeout(previewTimer)
  previewTimer = undefined
  if (previewVisible && !document.hidden) previewTimer = setTimeout(() => {
    previewTimer = undefined
    void updatePreview()
  }, 100)
})
watch(() => settings.pause, () => { if (waiting.value) scheduleRepeat() })
watch(loop, enabled => {
  if (!enabled) {
    repeatGlow.value = false
    if (waiting.value) stop()
  }
})
onMounted(() => {
  deviceTheme.addEventListener('change', syncDeviceTheme)
  window.addEventListener('keydown', playbackShortcut)
  document.addEventListener('visibilitychange', visibilityChanged)
  window.addEventListener('blur', stopForBackground)
  window.addEventListener('pagehide', stopForBackground)
  document.addEventListener('freeze', stopForBackground)
  previewObserver = new IntersectionObserver(([entry]) => {
    previewVisible = entry.isIntersecting
    if (!previewVisible) {
      clearTimeout(previewTimer)
      previewTimer = undefined
    } else if (previewQueued) {
      clearTimeout(previewTimer)
      previewTimer = undefined
      void updatePreview()
    }
  })
  previewObserver.observe(waveformDisplay.value)
  void updatePreview()
})
onBeforeUnmount(() => {
  deviceTheme.removeEventListener('change', syncDeviceTheme)
  clearTimeout(downloadPressTimer)
  clearTimeout(playPressTimer)
  window.removeEventListener('keydown', playbackShortcut)
  document.removeEventListener('visibilitychange', visibilityChanged)
  window.removeEventListener('blur', stopForBackground)
  window.removeEventListener('pagehide', stopForBackground)
  document.removeEventListener('freeze', stopForBackground)
  disposed = true
  previewVersion++
  clearTimeout(previewTimer)
  previewObserver?.disconnect()
  stop()
  void context?.close()
})
</script>

<template>
  <div class="mx-auto max-w-[1160px] px-2 sm:px-5 lg:px-8">
    <header class="flex h-16 items-center justify-between">
      <h1><a href="./" class="flex items-center gap-3 text-xl font-bold tracking-tight" aria-label="Birbifier home">
        <img src="/birb.svg" width="38" height="38" alt="" />Birbifier
      </a></h1>
      <div class="flex items-center gap-3">
        <a href="https://teuncm.nl/" class="text-sm font-medium text-muted hover:text-moss hover:underline" aria-label="Teun M. — teuncm.nl">Teun M. ↗</a>
        <button class="icon-button h-8 w-8" :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'" :title="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggleTheme"><AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" /></button>
      </div>
    </header>
    <main class="app-main pb-4 pt-2 lg:pb-6 lg:pt-3" @pointerdown.capture="reflection.rememberControl" @keydown.capture="reflection.rememberControl" @input.capture="reflection.rememberControl" @change.capture="reflection.rememberControl">
      <div class="mb-3 flex flex-wrap items-center gap-2">
          <button class="button-secondary" :disabled="allLocked" title="Randomize unlocked parameters" @click="randomize"><AppIcon name="dice" :size="16" />Randomize</button>
          <button class="button-secondary reset-button" @click="resetSound"><AppIcon name="reset" :size="16" />Reset</button>
          <button class="button-secondary" :aria-expanded="anyExpanded" aria-controls="wave-controls vibrato-controls tremolo-controls timing-controls effects-controls" @click="toggleAllControls"><AppIcon :name="anyExpanded ? 'up' : 'down'" :size="16" />{{ anyExpanded ? 'Collapse' : 'Expand' }}</button>
      </div>
      <div class="grid grid-cols-2 items-start gap-2 sm:gap-3 lg:grid-cols-[1fr_320px] lg:grid-rows-[auto_1fr]">
        <div class="contents lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:block lg:min-w-0 lg:space-y-3">
          <section class="playback-player panel overflow-hidden" aria-labelledby="preview-heading">
            <div class="min-w-0">
            <div class="hidden items-center justify-between px-3 pt-1 lg:flex">
              <h2 id="preview-heading" class="flex min-h-7 items-center text-sm font-semibold leading-tight">Playback</h2>
            </div>
            <div ref="waveformDisplay" class="waveform-display relative mx-2 mt-2 h-8 overflow-hidden rounded-lg bg-inset lg:mx-3 lg:mt-1 lg:h-20" :aria-busy="previewBusy">
              <svg viewBox="0 0 720 144" preserveAspectRatio="none" class="h-full w-full" role="img" aria-label="Waveform preview of the current song">
                <desc>Bar height shows the strongest peak from either stereo channel.</desc>
                <g v-memo="[bars]">
                  <line v-for="(height, i) in bars" :key="i" :x1="i * 4 + 2" :x2="i * 4 + 2" :y1="72 - height / 2" :y2="72 + height / 2" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" />
                </g>
                <PlaybackCursor v-if="playback" :playback="playback" />
              </svg>
              <span v-if="!bars.length" class="absolute inset-0 flex items-center justify-center text-xs text-muted">{{ previewBusy ? 'Rendering…' : 'Preview unavailable' }}</span>
            </div>
            </div>
            <div class="playback-controls mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line-subtle bg-surface p-2 sm:px-3" role="group" aria-label="Playback controls">
              <div class="flex flex-wrap items-center gap-2 lg:gap-3">
                <button class="button-primary" :class="{ 'play-attention': playHint, 'keyboard-pressed': playPressed }" :disabled="starting" :aria-label="starting ? 'Starting…' : playing ? 'Stop song' : 'Play song'" :title="starting ? 'Starting…' : playing ? 'Stop song' : 'Play song'" @animationend="playHint = false" @click="togglePlayback"><AppIcon :name="playing ? 'stop' : 'play'" :size="18" /></button>
                <button class="repeat-button px-4" :class="{ selected: loop, 'repeat-glow': repeatGlow }" :aria-pressed="loop" aria-label="Repeat song" :title="loop ? 'Repeat on' : 'Repeat off'" @animationend="repeatGlow = false" @click="loop = !loop"><AppIcon name="repeat" :size="18" /></button>
                <button ref="downloadButton" class="repeat-button px-4" :class="{ 'keyboard-pressed': downloadPressed }" :disabled="exporting" :aria-busy="exporting" aria-label="Download (WAV)" :title="exporting ? 'Saving…' : 'Download (WAV)'" @click="download"><AppIcon name="download" :size="18" /></button>
              </div>
              <span class="flex items-center gap-2 text-xs text-muted" role="status" aria-label="Playback status"><span class="h-1.5 w-1.5 rounded-full" :class="playing ? 'bg-moss' : 'bg-[#9ba88f]'"></span>{{ waiting ? 'Pause' : playing ? 'Playing' : 'Ready' }}</span>
            </div>
          </section>
          <section class="panel col-span-2 row-start-2 p-2 sm:p-3" aria-labelledby="synth-heading">
            <h2 id="synth-heading" class="mb-2 text-sm font-semibold leading-tight">Synth</h2>
            <div class="space-y-3">
            <ControlGroup id="wave-controls" title="Wave" :expanded="expanded.wave" @toggle="expanded.wave = !expanded.wave">
            <fieldset>
              <legend class="w-full text-sm font-medium" :class="{ 'mb-2': expanded.wave }"><span class="flex items-center justify-between">Shape<span class="flex items-center gap-1"><output v-if="!expanded.wave" class="value-readout" aria-label="Shape" data-parameter="shape">{{ settings.shape === 'saw' ? 'Sawtooth' : settings.shape === 'sine' ? 'Sine' : 'Square' }}</output><ParameterLock :locked="locks.shape" label="Shape" @toggle="locks.shape = !locks.shape" /></span></span></legend>
              <div v-if="expanded.wave" class="grid grid-cols-3 gap-2">
                <button v-for="shape in ['sine', 'square', 'saw']" :key="shape" class="shape-button" :class="{ selected: settings.shape === shape }" :aria-pressed="settings.shape === shape" @click="settings.shape = shape">
                  <svg viewBox="0 0 48 22" class="h-5 w-10" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path :d="shape === 'sine' ? 'M1 11C9-3 15-3 24 11S39 25 47 11' : shape === 'square' ? 'M1 18V4H24V18H47V4' : 'M1 18 23 4V18L47 4'" /></svg>
                  <span>{{ shape === 'saw' ? 'Sawtooth' : shape === 'sine' ? 'Sine' : 'Square' }}</span>
                </button>
              </div>
            </fieldset>
            <div class="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <RangeControl id="frequency" v-model="settings.frequency" label="Frequency" lock-label="Wave frequency" :min="250" :max="8000" :step="10" unit="Hz" :locked="locks.frequency" :expanded="expanded.wave" @toggle-lock="locks.frequency = !locks.frequency" />
              <RangeControl id="amplitude" v-model="settings.amplitude" label="Amplitude" :min="MIN_AMPLITUDE" :max="1" step="any" unit="dB" :locked="locks.amplitude" :expanded="expanded.wave" @toggle-lock="locks.amplitude = !locks.amplitude" />
            </div>
            </ControlGroup>
            <ControlGroup id="vibrato-controls" title="Vibrato" caption="Pitch LFO" :expanded="expanded.vibrato" @toggle="expanded.vibrato = !expanded.vibrato">
              <LfoVisualizer v-if="expanded.vibrato" id="vibrato-lfo" name="Vibrato" v-model:frequency="settings.vibratoFrequency" v-model:depth="settings.vibratoDepth" :max-frequency="30" :max-depth="1200" :depth-step="10" />
              <div class="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <RangeControl id="vibrato-frequency" v-model="settings.vibratoFrequency" label="Frequency" lock-label="Vibrato frequency" :min="0" :max="30" :step="0.1" unit="Hz" :locked="locks.vibratoFrequency" :expanded="expanded.vibrato" @toggle-lock="locks.vibratoFrequency = !locks.vibratoFrequency" />
                <RangeControl id="vibrato-depth" v-model="settings.vibratoDepth" label="Depth" lock-label="Vibrato depth" :min="0" :max="1200" :step="10" unit="cents" :locked="locks.vibratoDepth" :expanded="expanded.vibrato" @toggle-lock="locks.vibratoDepth = !locks.vibratoDepth" />
              </div>
            </ControlGroup>
            <ControlGroup id="tremolo-controls" title="Tremolo" caption="Volume LFO" :expanded="expanded.tremolo" @toggle="expanded.tremolo = !expanded.tremolo">
              <LfoVisualizer v-if="expanded.tremolo" id="tremolo-lfo" name="Tremolo" v-model:frequency="settings.tremoloFrequency" v-model:depth="settings.tremoloDepth" :max-frequency="30" :max-depth="1" :depth-step="0.01" />
              <div class="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <RangeControl id="tremolo-frequency" v-model="settings.tremoloFrequency" label="Frequency" lock-label="Tremolo frequency" :min="0" :max="30" :step="0.1" unit="Hz" :locked="locks.tremoloFrequency" :expanded="expanded.tremolo" @toggle-lock="locks.tremoloFrequency = !locks.tremoloFrequency" />
                <RangeControl id="tremolo-depth" v-model="settings.tremoloDepth" label="Depth" lock-label="Tremolo depth" :min="0" :max="1" :step="0.01" :scale="100" unit="%" :locked="locks.tremoloDepth" :expanded="expanded.tremolo" @toggle-lock="locks.tremoloDepth = !locks.tremoloDepth" />
              </div>
            </ControlGroup>
            </div>
          </section>
        </div>
        <BirdPortrait ref="mainBird" class="col-span-2 row-start-1 lg:col-span-1 lg:col-start-2" :settings="settings" :singing="playing && !waiting" :repeat="loop" :in-view="reflection.birdVisible.value">
          <template #presets>
            <PresetSelector ref="presetSelector" embedded v-model="activePreset" :presets="presets" @previous="browsePreset(-1)" @next="browsePreset(1)" />
          </template>
        </BirdPortrait>
        <aside class="col-span-2 row-start-3 space-y-3 lg:col-span-1 lg:col-start-2 lg:row-start-2">
          <section class="panel space-y-2 p-2 sm:p-3" aria-labelledby="master-heading">
          <h2 id="master-heading" class="text-sm font-semibold leading-tight">Master</h2>
          <ControlGroup id="effects-controls" title="Effects" caption="Global" :expanded="expanded.effects" @toggle="expanded.effects = !expanded.effects">
            <RangeControl id="cutoff" v-model="settings.cutoff" label="Low pass" lock-label="Cutoff" :min="250" :max="15000" :step="50" unit="Hz" :locked="locks.cutoff" :expanded="expanded.effects" @toggle-lock="locks.cutoff = !locks.cutoff" />
            <div class="mt-3">
              <RangeControl id="chorus" v-model="settings.chorus" label="Chorus" :min="0" :max="1" :step="0.01" :scale="100" unit="%" :locked="locks.chorus" :expanded="expanded.effects" @toggle-lock="locks.chorus = !locks.chorus" />
            </div>
          </ControlGroup>
          <ControlGroup id="timing-controls" title="Timing" :expanded="expanded.timing" @toggle="expanded.timing = !expanded.timing">
            <RangeControl id="duration" v-model="settings.duration" label="Duration" lock-label="Chirp duration" :min="0.5" :max="2" :step="0.05" unit="s" :locked="locks.duration" :expanded="expanded.timing" @toggle-lock="locks.duration = !locks.duration" />
            <div class="mt-3">
              <RangeControl id="pause" v-model="settings.pause" label="Pause" lock-label="Repeat pause" :min="0" :max="1" :step="0.05" unit="s" :locked="locks.pause" :expanded="expanded.timing" @toggle-lock="locks.pause = !locks.pause" />
            </div>
          </ControlGroup>
          </section>
          <p class="px-1 text-xs text-muted">Locks preserve parameters during randomization.</p>
          <p class="px-1 text-xs text-muted">Inspired by <a href="https://github.com/KilledByAPixel/ZzFX" class="underline decoration-line underline-offset-2 hover:text-moss">ZzFX</a>.</p>
        </aside>
      </div>
      <p v-if="error" class="error-message mt-5 rounded-lg border p-4 text-sm" role="alert">{{ error }}</p>
    </main>
    <Teleport to="body">
        <div v-if="reflection.visible.value" class="bird-reflection pointer-events-none fixed z-50 flex items-center justify-center rounded-full border border-line-subtle p-1 shadow-lg" :style="reflection.style.value" aria-hidden="true">
          <BirdPortrait ghost class="w-full opacity-80" :settings="settings" :singing="playing && !waiting" :repeat="loop" />
        </div>
    </Teleport>
  </div>
</template>
