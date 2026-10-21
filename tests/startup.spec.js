import { test, expect } from '@playwright/test'

test('each load selects a random preset with repeat enabled and no autoplay', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => Number(sessionStorage.getItem('test-random') || 0)
  })
  await page.goto('/')
  const presets = await page.evaluate(async () => (await import('/src/audio.js')).presets)
  for (const random of [0, 0.5, 0.999]) {
    await page.evaluate(value => sessionStorage.setItem('test-random', String(value)), random)
    await page.reload()
    const preset = presets[Math.floor(random * presets.length)]
    await expect(page.getByRole('combobox', { name: 'Presets' })).toHaveValue(preset.name)
    await expect(page.locator('#frequency')).toHaveAttribute('aria-valuenow', String(preset.settings.frequency))
    await expect(page.locator('#pause')).toHaveValue(String(preset.settings.pause))
    await expect(page.getByRole('button', { name: 'Repeat song', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('status', { name: 'Playback status' })).toHaveText('Ready')
    await expect(page.getByRole('img', { name: 'Bird generated' })).toHaveAttribute('data-singing', 'false')
  }
  // Browsing after startup continues from the randomly selected preset.
  await page.getByRole('button', { name: 'Next preset' }).click()
  await expect(page.getByRole('combobox', { name: 'Presets' })).toHaveValue(presets[0].name)
  await page.getByRole('button', { name: 'Stop song' }).click()
})

test('play glows twice after half a second and playing dismisses the hint', async ({ page }) => {
  await page.goto('/')
  const play = page.getByRole('button', { name: 'Play song', exact: true })
  await expect(play).toHaveCSS('animation-name', 'play-glow')
  await expect(play).toHaveCSS('animation-delay', '0.5s')
  await expect(play).toHaveCSS('animation-iteration-count', '2')
  await expect(play).not.toHaveClass(/play-attention/)
  await page.reload()
  await play.click()
  await page.getByRole('button', { name: 'Stop song' }).click()
  await expect(play).not.toHaveClass(/play-attention/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await expect(play).toHaveCSS('animation-name', 'none')
})
