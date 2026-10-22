import { test, expect } from '@playwright/test'
import { defaultSettings, presets } from '../src/audio.js'
import { MIN_AMPLITUDE } from '../src/randomize.js'
import { birdShareUrl, decodeBird, encodeBird } from '../src/share.js'

const custom = { ...defaultSettings, shape: 'saw', frequency: 4560, amplitude: MIN_AMPLITUDE, vibratoFrequency: 4.2, vibratoDepth: 720, tremoloFrequency: 3.1, tremoloDepth: 0.78, duration: 1.45, cutoff: 6000, pause: 0.65, chorus: 0.67 }

test('compact positional URLs preserve every preset and exact amplitude values', () => {
  expect(encodeBird(defaultSettings)).toBe('0,2400,.45,8,180,6,.45,.8,8000,.2,.3,1')
  for (const settings of [...presets.map(preset => preset.settings), custom]) {
    for (const repeat of [false, true]) {
      expect(decodeBird(encodeBird(settings, repeat))).toEqual({ settings, repeat })
    }
  }
  expect(birdShareUrl(defaultSettings, true, 'https://teuncm.nl/birbifier/?old=1#controls')).toBe('https://teuncm.nl/birbifier/?p=0,2400,.45,8,180,6,.45,.8,8000,.2,.3,1')
})

test('malformed and out-of-range shared parameters are rejected', () => {
  for (const value of [null, '', '0,1,2', 'x'.repeat(300)]) expect(decodeBird(value)).toBeNull()
  const valid = encodeBird(defaultSettings).split(',')
  for (const [index, value] of [[0, '9'], [0, '.5'], [1, '9000'], [2, '.1'], [3, '31'], [4, '1201'], [5, '-1'], [6, '1.01'], [7, '3'], [8, '15001'], [9, '2'], [10, '1.01'], [11, '2'], [1, 'NaN'], [1, 'Infinity'], [1, ''], [1, '0x1000'], [1, '<script>']]) {
    const parts = [...valid]
    parts[index] = value
    expect(decodeBird(parts.join(',')), `${index}: ${value}`).toBeNull()
  }
})

for (const repeat of [false, true]) {
  test(`shared links restore every parameter and Repeat ${repeat} without autoplay`, async ({ page }) => {
    await page.goto(`/?p=${encodeBird(custom, repeat)}`)
    for (const [key, value] of Object.entries(custom)) {
      if (key === 'shape') {
        await expect(page.getByRole('button', { name: 'Sawtooth', exact: true })).toHaveAttribute('aria-pressed', 'true')
      } else {
        const id = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
        await expect(page.locator(`#${id}`)).toHaveAttribute('aria-valuenow', String(value))
      }
    }
    await expect(page.getByRole('button', { name: 'Repeat song', exact: true })).toHaveAttribute('aria-pressed', String(repeat))
    await expect(page.getByRole('status', { name: 'Playback status' })).toHaveText('Ready')
    await expect(page.getByRole('img', { name: 'Bird generated' })).toHaveAttribute('data-singing', 'false')
    await expect(page.getByRole('combobox', { name: 'Presets' })).toHaveValue('')
  })
}

test('invalid shared links fall back to the usual random preset', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0 })
  await page.goto('/?p=0,90000,1')
  await expect(page.getByRole('combobox', { name: 'Presets' })).toHaveValue('001 Little chirp')
  await expect(page.locator('#frequency')).toHaveValue('2400')
})

test('clipboard sharing produces a link that recreates the same bird', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedBird = text } } })
  })
  await page.goto(`/?p=${encodeBird(custom, false)}`)
  await page.locator('#frequency').fill('3210')
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const before = await bird.innerHTML()
  await page.getByRole('button', { name: 'Share bird', exact: true }).click()
  await expect(page.getByText('Bird link copied', { exact: true })).toHaveText('Bird link copied')
  const link = await page.evaluate(() => window.copiedBird)
  expect(link).toContain('?p=2,3210,')
  expect(link).not.toContain('%2C')
  expect(decodeBird(new URL(link).searchParams.get('p'))).toEqual({ settings: { ...custom, frequency: 3210 }, repeat: false })
  await page.goto(link)
  await expect(bird).toHaveAttribute('data-singing', 'false')
  expect(await bird.innerHTML()).toBe(before)
})

test('native sharing receives the current link and cancellation does not copy it', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => {
      window.sharedBird = data
      if (window.cancelShare) throw new DOMException('Cancelled', 'AbortError')
    } })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { window.copiedUnexpectedly = true } } })
  })
  await page.goto(`/?p=${encodeBird(defaultSettings)}`)
  await page.getByRole('button', { name: 'Share bird', exact: true }).click()
  const shared = await page.evaluate(() => window.sharedBird)
  expect(shared.title).toBe('Birbifier')
  expect(new URL(shared.url).searchParams.get('p')).toBe(encodeBird(defaultSettings))
  await page.evaluate(() => { window.cancelShare = true })
  await page.getByRole('button', { name: 'Share bird', exact: true }).click()
  expect(await page.evaluate(() => window.copiedUnexpectedly)).toBeUndefined()
  await expect(page.getByRole('textbox', { name: 'Bird share link' })).toHaveCount(0)
})

test('the mobile bird footer keeps Share and download side by side and offers a selectable fallback', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Unavailable', 'NotAllowedError') } })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied') } } })
  })
  await page.goto(`/?p=${encodeBird(defaultSettings)}`)
  const card = page.getByRole('region', { name: 'Your bird', exact: true })
  const share = card.getByRole('button', { name: 'Share bird', exact: true })
  const download = card.getByRole('button', { name: 'Download bird SVG', exact: true })
  const perch = await card.locator('[data-bird-perch]').boundingBox()
  const shareBox = await share.boundingBox()
  const downloadBox = await download.boundingBox()
  expect(shareBox.y).toBeGreaterThanOrEqual(perch.y + perch.height)
  expect(downloadBox.y).toBe(shareBox.y)
  expect(downloadBox.x).toBeGreaterThan(shareBox.x + shareBox.width)
  await share.click()
  const input = page.getByRole('textbox', { name: 'Bird share link' })
  await expect(input).toBeVisible()
  expect(await input.evaluate(input => input.selectionEnd - input.selectionStart)).toBe((await input.inputValue()).length)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const pending = page.waitForEvent('download')
  await download.click()
  expect((await pending).suggestedFilename()).toBe('birbifier-bird.svg')
})

test('social metadata points to a bird illustration in a 1200 by 630 PNG', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-card\.png\?v=2$/)
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /cute green bird/)
  const svg = await (await request.get('/social-card.svg')).text()
  expect(svg).toContain('data-torso')
  expect(svg).toContain('data-head')
  const png = await (await request.get('/social-card.png?v=2')).body()
  expect(png.readUInt32BE(16)).toBe(1200)
  expect(png.readUInt32BE(20)).toBe(630)
})
