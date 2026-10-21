import { test, expect } from '@playwright/test'
import { defaultSettings } from '../src/audio.js'
import { parameterRanges, randomizeSettings } from '../src/randomize.js'

test('randomized low pass stays above pitch and respects either parameter lock', () => {
  expect(parameterRanges.cutoff[0]).toBe(parameterRanges.frequency[0])
  const scenarios = [
    { settings: defaultSettings, locks: {} },
    { settings: { ...defaultSettings, frequency: 7990 }, locks: { frequency: true } },
    { settings: { ...defaultSettings, cutoff: 300 }, locks: { cutoff: true } },
    { settings: { ...defaultSettings, cutoff: 1500 }, locks: { cutoff: true } },
    { settings: { ...defaultSettings, frequency: 8000, cutoff: 300 }, locks: { cutoff: true } },
  ]
  for (const { settings, locks } of scenarios) {
    for (let i = 0; i < 100; i++) {
      let call = i
      const next = randomizeSettings(settings, locks, () => ((call++ * 73) % 101) / 101)
      expect(next.cutoff).toBeGreaterThanOrEqual(next.frequency)
      expect(next.cutoff).toBeGreaterThanOrEqual(300)
      expect(next.cutoff % 100).toBe(0)
      expect(next.frequency % 10).toBe(0)
      for (const key of Object.keys(locks)) expect(next[key]).toBe(settings[key])
    }
  }
  const locked = { ...defaultSettings, frequency: 8000, cutoff: 300 }
  const next = randomizeSettings(locked, { frequency: true, cutoff: true })
  expect(next.frequency).toBe(locked.frequency)
  expect(next.cutoff).toBe(locked.cutoff)
})
