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

Each page load selects a random preset with Repeat enabled. Press Play to start. The Play button glows white twice after half a second; the hint respects reduced-motion preferences.

Randomize always starts the sound from the beginning. Reset always stops playback. Selecting a preset from the dropdown restarts an active chirp, including during repeat pauses, and stays silent when playback is stopped. Preset arrows continue to audition sounds immediately.

Preset amplitudes are calibrated to approximately 0.05 RMS (−26.0 dBFS) over the active chirp with the default effects enabled, keeping average levels similar. Effect tails are excluded from this measurement. Manual amplitude changes still control volume normally. Playback, preview, and WAV export share a final soft limiter: signals below 0.2 pass unchanged, and larger peaks smoothly approach a ceiling of 0.25 (−12 dBFS). This is RMS balancing, rather than perceptual loudness matching.

Master's Effects section groups the low-pass filter and a subtle stereo chorus before the limiter. A fourth-order safety low-pass attenuates near-Nyquist content; the soft limiter uses 4× oversampling and a final peak guard retains the 0.25 ceiling. Chorus defaults to 30% mix across all presets and can be adjusted from 30–50%. It starts locked against randomization, and loading any preset or Reset restores the lock. Unlock it to include it in randomization; manual adjustments always remain available. It uses opposing slow modulation of two short delays. Stop and restarting a sound clear the previous chorus tail. WAV export always includes the current effects and limiting, using the same signal path as playback and the waveform. It is stereo 16-bit PCM and includes 0.04 seconds of chorus tail, with a short fade at the end.

Preview and WAV export share a four-entry cache of full-quality audio buffers, including renders already in progress. Repeat pause changes reuse the same audio. Rapid edits debounce previews and queue only the latest settings behind an active render. Live edits schedule only changed audio parameters. Vue's unused Options API is excluded from production builds.

Choose sine, square, or sawtooth. Wave frequency controls pitch in Hz, and amplitude controls volume. Vibrato adds pitch modulation (frequency in Hz, depth in cents); tremolo adds volume modulation (frequency in Hz, depth in percent). Set either modulation's depth to zero to disable it. The global low-pass cutoff softens high frequencies.

Synth groups Wave, Vibrato, and Tremolo. Master groups Effects (low-pass filter and chorus) and Timing. Toggle any group header or use Collapse / Expand. Collapsed groups retain labeled values and working parameter locks; expanded groups show the sliders, wave choices, and LFO visualizers. Collapsing preserves settings, locks, and playback.

The Presets dropdown offers 50 sounds, including whistles, warbles, rattles, low calls, and electronic chirps. Use the left/right buttons to browse and immediately play the selected sound, wrapping at either end. Arrow navigation restarts playback from the beginning and preserves the Repeat setting. After custom edits, browsing continues from the last selected preset. Selecting a preset loads all parameters, including its repeat pause. Edits or randomization show Custom when the settings no longer match a preset.

Chirp duration ranges from 0.5 to 2 seconds. Enable Repeat to play continuously with an adjustable pause of 0 to 1 second between chirps. Pause changes take effect during a pending pause; disabling Repeat finishes the current chirp and cancels any pending repeat. Stop cancels playback immediately. Download exports one chirp and its effect tail as a stereo 16-bit WAV. Sound controls update during playback; duration changes apply on the next play. Playback, waveform preview, and export share the same audio graph, with short fades and conservative output headroom.

Vibrato and tremolo each have a centered one-second LFO visualizer showing modulation depth around zero. Drag horizontally to change frequency and vertically to change depth, or focus the visualizer and use the arrow keys. The sliders remain available for precise adjustments.

Randomize changes every unlocked parameter, including wave shape, duration, repeat pause, and filter cutoff. Low pass ranges from 300 to 15,000 Hz; randomization keeps it at or above the wave frequency. A locked cutoff limits randomized wave frequencies instead. Each parameter has a lock button. Locks affect randomization; manual edits, presets, and reset remain available.

Audio starts after pressing Play or a preset arrow. All synthesis and export happen locally in the browser. A recent browser with Web Audio support is required. Neural-network learning and multiple segments are future work.

Your bird is a generated SVG portrait based on the current sound settings. Pitch and filter shape its colors; wave shape and amplitude shape its body; vibrato shapes its crest and tail; tremolo shapes its feathers and markings; duration and repeat pause shape its proportions and beak. Randomizing creates a new bird, and returning to the same settings restores the same portrait. Its beak moves during chirps and closes during repeat pauses or after stopping. Reduced-motion mode uses a still open beak while singing. Use the portrait's download button to save a standalone SVG.

## Verify

The Playwright tests check the controls, mobile layout, playback lifecycle and repeat timing, per-parameter locks, randomization, preset browsing and audio, LFO interaction and centering, duration endpoints, and WAV export.

```sh
npx playwright install chromium
npm test
```

To use an already installed Edge or Chrome browser instead, set `BIRBIFIER_TEST_CHANNEL` to `msedge` or `chrome`.

## GitHub Pages

In **Settings → Pages**, set **Source** to **GitHub Actions**. The
**Deploy to GitHub Pages** workflow builds the app, then publishes
only `dist` on every push to `main`; it can also be run manually. Publishing
the source repository directly skips Vite and causes module-loading errors.

Relative asset URLs support `https://teuncm.nl/birbifier/` and other repository
subpaths. The custom domain stays configured on the account's main Pages site.

## Search and sharing

The canonical URL is `https://teuncm.nl/birbifier/`. Titles, descriptions, Open Graph and Twitter cards, and WebApplication structured data are served directly in the HTML. The initial HTML also describes the app before Vue mounts, including when JavaScript is disabled. The share card is `public/social-card.png`, with its editable source in `public/social-card.svg`.

Link to `https://teuncm.nl/birbifier/` from the main site's HTML navigation or project list. Submit `https://teuncm.nl/birbifier/sitemap.xml` in Google Search Console, or add `Sitemap: https://teuncm.nl/birbifier/sitemap.xml` to the main site's `https://teuncm.nl/robots.txt`. A robots file inside `/birbifier/` has no effect; this repository does not control the domain root. If the app moves, update the canonical, social URLs, structured data, and sitemap together.

Wave frequency ranges from 300 to 8,000 Hz, amplitude from −10 to 0 dB (approximately 31.6–100% linear gain), and both vibrato and tremolo frequencies from 0–30 Hz. Slider endpoint hints are hidden; current values remain visible.

The theme follows the device appearance by default, including changes while the page is open. Dark mode uses neutral charcoal surfaces with green accents. The sun/moon button beside Teun M. switches between dark and softer sage light themes; a manual choice is remembered locally and overrides the device setting. The compact waveform has no grid or axis line; LFO visualizers retain their grids.
