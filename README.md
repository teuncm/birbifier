# Birbifier

A small, mobile-friendly birdsong synthesizer built with Vue, Tailwind CSS, and the browser's Web Audio API. One editable oscillator keeps things simple; no server or audio libraries are needed.

## Run locally

Requires Node.js `^22.18.0 || >=24.12.0`.

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
```

## Make a song

Choose sine, square, or sawtooth. Wave speed controls pitch in Hz, and amplitude controls volume. Vibrato adds pitch modulation (speed in Hz, depth in cents); tremolo adds volume modulation (speed in Hz, depth in percent). Set either modulation's depth to zero to disable it. The global low-pass cutoff softens high frequencies.

Controls are grouped into Wave, Vibrato, Tremolo, Timing, and Low-pass filter. Toggle any group header or use Collapse all / Expand all. Collapsed groups retain labeled values and working parameter locks; expanded groups show the sliders, wave choices, and LFO visualizers. Collapsing preserves settings, locks, and playback.

The Presets dropdown offers 50 sounds, including whistles, warbles, rattles, low calls, and electronic chirps. Use the left/right buttons to browse and immediately play the selected sound, wrapping at either end. Arrow navigation restarts playback from the beginning and preserves the Repeat setting. After custom edits, browsing continues from the last selected preset. Selecting a preset loads all parameters, including its repeat pause. Edits or randomization show Custom when the settings no longer match a preset.

Chirp duration ranges from 0.5 to 5 seconds. Enable Repeat to play continuously with an adjustable pause of 0 to 3 seconds between chirps. Pause changes take effect during a pending pause; disabling Repeat finishes the current chirp and cancels any pending repeat. Stop cancels playback immediately. Download exports one chirp as a mono 16-bit WAV. Sound controls update during playback; duration changes apply on the next play. Playback, waveform preview, and export share the same audio graph, with short fades and conservative output headroom.

Vibrato and tremolo each have a centered one-second LFO visualizer showing modulation depth around zero. Drag horizontally to change speed and vertically to change depth, or focus the visualizer and use the arrow keys. The sliders remain available for precise adjustments.

Randomize changes every unlocked parameter, including wave shape, duration, repeat pause, and filter cutoff. Each parameter has a lock button. Locks affect randomization; manual edits, presets, and reset remain available.

Audio starts after pressing Play or a preset arrow. All synthesis and export happen locally in the browser. A recent browser with Web Audio support is required. Neural-network learning and multiple segments are future work.

## Verify

The Playwright tests check the controls, mobile layout, playback lifecycle and repeat timing, per-parameter locks, randomization, preset browsing and audio, LFO interaction and centering, duration endpoints, and WAV export.

```sh
npx playwright install chromium
npm test
```

To use an already installed Edge or Chrome browser instead, set `BIRBIFIER_TEST_CHANNEL` to `msedge` or `chrome`.
