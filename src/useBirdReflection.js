import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

export function useBirdReflection(settings, bird) {
  const visible = ref(false)
  const birdVisible = ref(true)
  const style = shallowRef({})
  let observer, timer, anchor, frame, perch, positionDirty = true, lastEditAt = -Infinity

  function birdInView() {
    if (observer) return birdVisible.value
    if (!perch) return true
    const rect = perch.getBoundingClientRect()
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth
  }

  function rememberControl(event) {
    const control = event.target.closest?.('.range-control, .lfo-surface, .shape-button, #preset, button')
    if (control && control !== anchor) {
      anchor = control
      positionDirty = true
    }
  }
  function position() {
    if (!anchor?.isConnected) return false
    if (!positionDirty) return true
    const rect = anchor.getBoundingClientRect()
    if (rect.bottom < 0 || rect.top > window.innerHeight) return false
    const size = Math.min(144, Math.round(window.innerWidth * 0.34))
    const gap = 12
    let left = rect.right + gap
    if (left + size > window.innerWidth - gap) {
      left = rect.left >= size + gap * 2 ? rect.left - size - gap : window.innerWidth - size - gap
    }
    const top = rect.top >= size + gap * 2 ? rect.top - size - gap : rect.bottom + gap
    style.value = {
      width: `${size}px`, height: `${size}px`, left: `${Math.max(gap, left)}px`,
      top: `${Math.max(gap, Math.min(top, window.innerHeight - size - gap))}px`,
    }
    positionDirty = false
    return true
  }
  function hide() {
    visible.value = false
    clearTimeout(timer)
    cancelAnimationFrame(frame)
    frame = undefined
  }
  function reposition() {
    positionDirty = true
    if (!visible.value || frame !== undefined) return
    frame = requestAnimationFrame(() => {
      frame = undefined
      if (!position()) hide()
    })
  }
  function showReflection() {
    if (birdInView() || !position()) return
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(hide, 1800)
  }
  watch(() => Object.values(settings), () => {
    lastEditAt = performance.now()
    showReflection()
  })
  onMounted(() => {
    perch = bird.value?.$el.querySelector('[data-bird-perch]')
    birdVisible.value = birdInView()
    if (perch && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        birdVisible.value = entry.isIntersecting
        if (entry.isIntersecting) hide()
        // Input can arrive just before the observer reports a scroll off-screen.
        else if (performance.now() - lastEditAt < 200) showReflection()
      })
      observer.observe(perch)
    }
    window.addEventListener('scroll', reposition, { passive: true, capture: true })
    window.addEventListener('resize', reposition, { passive: true })
  })
  onBeforeUnmount(() => {
    hide()
    observer?.disconnect()
    window.removeEventListener('scroll', reposition, true)
    window.removeEventListener('resize', reposition)
  })
  return { visible, birdVisible, style, rememberControl }
}
