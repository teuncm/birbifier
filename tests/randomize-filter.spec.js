import { test, expect } from '@playwright/test'
import { defaultSettings } from '../src/audio.js'
import { parameterRanges, randomizeSettings } from '../src/randomize.js'

test('randomized low pass stays above the bottom of the vibrato range and respects locks', () => {
  expect(parameterRanges.cutoff[0]).toBe(parameterRanges.frequency[0])
  const scenarios = [
    { settings: defaultSettings, locks: {} },
    { settings: { ...defaultSettings, frequency: 7990 }, locks: { frequency: true } },
    { settings: { ...defaultSettings, cutoff: 300 }, locks: { cutoff: true } },
    { settings: { ...defaultSettings, cutoff: 1500 }, locks: { cutoff: true } },
    { settings: { ...defaultSettings, frequency: 8000, cutoff: 300 }, locks: { cutoff: true } },
    { settings: { ...defaultSettings, frequency: 1000, cutoff: 800 }, locks: { frequency: true, cutoff: true } },
    { settings: { ...defaultSettings, vibratoDepth: 0, cutoff: 250 }, locks: { vibratoDepth: true, cutoff: true } },
  ]
  for (const { settings, locks } of scenarios) {
    for (let i = 0; i < 100; i++) {
      let call = i
      const next = randomizeSettings(settings, locks, () => ((call++ * 73) % 101) / 101)
      expect(next.cutoff).toBeGreaterThanOrEqual(next.frequency * 2 ** (-next.vibratoDepth / 1200))
      expect(next.cutoff).toBeGreaterThanOrEqual(250)
      expect(next.cutoff).toBeLessThanOrEqual(15000)
      expect(next.cutoff % 50).toBe(0)
      expect(next.frequency % 10).toBe(0)
      for (const key of Object.keys(locks)) expect(next[key]).toBe(settings[key])
    }
  }
  const locked = { ...defaultSettings, frequency: 8000, cutoff: 300 }
  const next = randomizeSettings(locked, { frequency: true, cutoff: true })
  expect(next.frequency).toBe(locked.frequency)
  expect(next.cutoff).toBe(locked.cutoff)
})

test('vibrato cents are converted to pitch before choosing a low-pass cutoff', () => {
  for (const [frequency, vibratoDepth, expectedCutoff] of [[1000, 0, 1000], [1000, 1200, 500], [1000, 600, 750], [250, 1200, 250]]) {
    const next = randomizeSettings({ ...defaultSettings, frequency, vibratoDepth }, { frequency: true, vibratoDepth: true }, () => 0)
    expect(next.cutoff).toBe(expectedCutoff)
  }
})
