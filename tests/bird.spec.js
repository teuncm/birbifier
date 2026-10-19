import { test, expect } from '@playwright/test'

async function setSlider(page, id, value) {
  await page.locator(`#${id}`).evaluate((input, next) => {
    input.value = next
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, String(value))
}

test('sound settings generate reproducible birds and a standalone SVG download', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset sound', exact: true }).click()
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const original = await bird.innerHTML()
  await page.getByRole('button', { name: 'Randomize', exact: true }).click()
  await expect.poll(() => bird.innerHTML()).not.toBe(original)
  await page.getByRole('button', { name: 'Reset sound' }).click()
  await expect.poll(() => bird.innerHTML()).toBe(original)
  // Every sound parameter contributes to the portrait.
  for (const [id, value] of Object.entries({ frequency: 8000, amplitude: 1, 'vibrato-speed': 40, 'vibrato-depth': 1200, 'tremolo-speed': 30, 'tremolo-depth': 1, duration: 2, pause: 1, cutoff: 200 })) {
    const before = await bird.innerHTML()
    await setSlider(page, id, value)
    await expect.poll(() => bird.innerHTML()).not.toBe(before)
  }
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download bird SVG' }).click()
  const download = await pending
  expect(download.suggestedFilename()).toBe('birbifier-bird.svg')
  const stream = await download.createReadStream()
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  const svg = Buffer.concat(chunks).toString()
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  expect(svg).not.toContain('animation:')
  await page.setViewportSize({ width: 320, height: 740 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('beak sings during chirps, rests during repeat pauses, and closes on stop', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset sound', exact: true }).click()
  await setSlider(page, 'duration', 0.5)
  await setSlider(page, 'pause', 0.5)
  const bird = page.getByRole('img', { name: 'Bird generated' })
  await expect(bird).toHaveAttribute('data-singing', 'false')
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect(bird).toHaveAttribute('data-singing', 'true')
  await expect(bird.locator('[data-beak]')).toHaveCSS('animation-name', 'bird-chirp')
  await expect(bird.locator('[data-wing]')).toHaveCSS('animation-name', 'bird-flutter')
  await expect(bird.locator('[data-tail]')).toHaveCSS('animation-name', 'bird-tail-flick')
  await expect(bird.locator('[data-body]')).toHaveCSS('animation-name', 'bird-bob')
  await expect(bird).toHaveAttribute('data-singing', 'false')
  await expect(bird).toHaveAttribute('data-singing', 'true')
  await page.getByRole('button', { name: 'Stop song', exact: true }).click()
  await expect(bird).toHaveAttribute('data-singing', 'false')
  await expect(bird.locator('[data-beak]')).toHaveCSS('animation-name', 'none')
  for (const part of ['wing', 'tail', 'body']) await expect(bird.locator(`[data-${part}]`)).toHaveCSS('animation-name', 'none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect(bird).toHaveAttribute('data-singing', 'true')
  for (const part of ['beak', 'wing', 'tail', 'body']) await expect(bird.locator(`[data-${part}]`)).toHaveCSS('animation-name', 'none')
  await page.getByRole('button', { name: 'Stop song', exact: true }).click()
})
