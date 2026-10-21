import { test, expect } from '@playwright/test'
import { buildWaveform } from '../src/waveform.js'

test('unchanged audio reuses waveform analysis without scanning samples again', () => {
  let reads = 0
  const samples = new Float32Array([0.1, 0.4, -0.2, 0.3])
  const audio = { length: 4, numberOfChannels: 1, getChannelData: () => { reads++; return samples } }
  const first = buildWaveform(audio, 2)
  expect(buildWaveform(audio, 2)).toBe(first)
  expect(reads).toBe(1)
  expect(buildWaveform(audio, 1)[0]).toBeCloseTo(240, 4)
  expect(reads).toBe(2)
  expect(buildWaveform(audio, 2)).toBe(first)
})

function buffer(channels) {
  return { length: channels[0].length, numberOfChannels: channels.length, getChannelData: index => channels[index] }
}

test('waveform keeps stereo peaks even when channels have opposite polarity', () => {
  const audio = buffer([new Float32Array([0.1, -0.2, 0.3, -0.4]), new Float32Array([-0.1, 0.2, -0.3, 0.4])])
  const bars = buildWaveform(audio, 2)
  expect(bars[0]).toBeCloseTo(120, 4)
  expect(bars[1]).toBeCloseTo(240, 4)
})

test('waveform includes right-only peaks and renders silence as minimal bars', () => {
  const audio = buffer([new Float32Array(4), new Float32Array([0, 0, 0.5, 0])])
  expect(buildWaveform(audio, 2)).toEqual([1, 300])
  const silent = buffer([new Float32Array(180)])
  expect(buildWaveform(silent)).toEqual(Array(180).fill(1))
})
