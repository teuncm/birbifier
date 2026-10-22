import { parameterRanges } from './randomize.js'

// Public URL format: keep this order stable; append future fields at the end.
const shapes = ['sine', 'square', 'saw']
const fields = ['frequency', 'amplitude', 'vibratoFrequency', 'vibratoDepth', 'tremoloFrequency', 'tremoloDepth', 'duration', 'cutoff', 'pause', 'chorus']

export function encodeBird(settings, repeat = true) {
  return [shapes.indexOf(settings.shape), ...fields.map(key => settings[key]), repeat ? 1 : 0]
    .map(value => String(value).replace(/^0\./, '.')).join(',')
}

export function decodeBird(value) {
  if (typeof value !== 'string' || value.length > 256) return null
  const parts = value.split(',')
  if (parts.length !== fields.length + 2 || parts.some(part => !/^(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(part))) return null
  const values = parts.map(Number)
  const shape = shapes[values[0]]
  const repeat = values.at(-1)
  if (!shape || !Number.isInteger(values[0]) || (repeat !== 0 && repeat !== 1)) return null
  const settings = { shape }
  for (let i = 0; i < fields.length; i++) {
    const key = fields[i]
    const [min, max] = parameterRanges[key]
    const number = values[i + 1]
    if (!Number.isFinite(number) || number < min || number > max) return null
    settings[key] = number
  }
  return { settings, repeat: Boolean(repeat) }
}

export function birdShareUrl(settings, repeat, location) {
  const url = new URL(location)
  url.search = `?p=${encodeBird(settings, repeat)}`
  url.hash = ''
  return url.href
}
