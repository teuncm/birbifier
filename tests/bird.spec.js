import { test, expect } from '@playwright/test'

async function setSlider(page, id, value) {
  await page.locator(`#${id}`).evaluate((input, next) => {
    input.value = next
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, String(value))
}

test('deep tremolo makes the beak follow the slower modulation frequency', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await setSlider(page, 'duration', 2)
  await setSlider(page, 'vibrato-frequency', 10)
  await setSlider(page, 'tremolo-frequency', 4)
  await setSlider(page, 'tremolo-depth', 0.8)
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  const beak = page.getByRole('img', { name: 'Bird generated' }).locator('[data-beak]')
  await expect(beak).toHaveCSS('animation-duration', '0.05s')
  await setSlider(page, 'tremolo-depth', 0.81)
  await expect(beak).toHaveCSS('animation-duration', '0.125s')
  await setSlider(page, 'tremolo-frequency', 20)
  await expect(beak).toHaveCSS('animation-duration', '0.05s')
  await setSlider(page, 'tremolo-frequency', 4)
  await setSlider(page, 'tremolo-depth', 0.8)
  await expect(beak).toHaveCSS('animation-duration', '0.05s')
})

test('sound settings generate reproducible birds and a standalone SVG download', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const original = await bird.innerHTML()
  await page.getByRole('button', { name: 'Randomize', exact: true }).click()
  await expect.poll(() => bird.innerHTML()).not.toBe(original)
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect.poll(() => bird.innerHTML()).toBe(original)
  // Every sound parameter contributes to the portrait.
  for (const [id, value] of Object.entries({ frequency: 8000, amplitude: 1, 'vibrato-frequency': 30, 'vibrato-depth': 1200, 'tremolo-frequency': 30, 'tremolo-depth': 1, duration: 2, pause: 1, cutoff: 300 })) {
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
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
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
