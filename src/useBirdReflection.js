import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

export function useBirdReflection(settings, bird) {
  const visible = ref(false)
  const style = shallowRef({})
  let observer, timer, anchor

  function birdInView() {
    const svg = bird.value?.$el.querySelector('svg')
    if (!svg) return true
    const rect = svg.getBoundingClientRect()
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth
  }

  function rememberControl(event) {
    const control = event.target.closest?.('.range-control, .lfo-surface, .shape-button, #preset, button')
    if (control) anchor = control
  }
  function position() {
    if (!anchor?.isConnected) return false
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
    return true
  }
  function hide() {
    visible.value = false
    clearTimeout(timer)
  }
  function reposition() {
    if (visible.value && !position()) hide()
  }
  watch(() => Object.values(settings), () => {
    if (birdInView() || !position()) return
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(hide, 1800)
  })
  onMounted(() => {
    const svg = bird.value?.$el.querySelector('svg')
    if (svg && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) hide()
      })
      observer.observe(svg)
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
  return { visible, style, rememberControl }
}
