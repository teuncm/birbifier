import { nextTick, onBeforeUnmount, onMounted } from 'vue'

export function useControlFeedback() {
  const pointers = new Map()
  const timers = new Map()
  let disposed = false
  function held(element) {
    for (const pointer of pointers.values()) if (pointer === element) return true
    return false
  }
  function clear(element) {
    clearTimeout(timers.get(element))
    timers.delete(element)
    element.classList.remove('is-interacting')
  }
  function press(element) {
    clearTimeout(timers.get(element))
    timers.delete(element)
    element.classList.add('is-interacting')
  }
  function pulse(element, duration = 180) {
    press(element)
    timers.set(element, setTimeout(() => {
      timers.delete(element)
      if (!held(element)) element.classList.remove('is-interacting')
    }, duration))
  }
  function pointerDown(event) {
    if (event.button !== 0) return
    const element = event.target.closest?.('button, input[type="range"]')
    if (!element || element.disabled) return
    pointers.set(event.pointerId, element)
    press(element)
  }
  function pointerEnd(event) {
    const element = pointers.get(event.pointerId)
    if (!element) return
    pointers.delete(event.pointerId)
    if (held(element)) return
    if (event.type === 'pointercancel') clear(element)
    else pulse(element, element.tagName === 'BUTTON' ? 180 : 100)
  }
  function click(event) {
    const element = event.target.closest?.('button')
    if (!element || element.disabled) return
    pulse(element)
    // Selection/lock changes patch the button's class. Restore the short pulse
    // after that update so quick taps still show feedback for the whole hold.
    void nextTick(() => { if (!disposed && element.isConnected) pulse(element) })
  }
  function input(event) {
    if (event.target.matches?.('input[type="range"]') && !held(event.target)) pulse(event.target, 100)
  }
  function reset() {
    const elements = new Set([...pointers.values(), ...timers.keys()])
    pointers.clear()
    for (const element of elements) clear(element)
  }
  function visibility() { if (document.hidden) reset() }
  onMounted(() => {
    document.addEventListener('pointerdown', pointerDown, true)
    window.addEventListener('pointerup', pointerEnd, true)
    window.addEventListener('pointercancel', pointerEnd, true)
    document.addEventListener('click', click)
    document.addEventListener('input', input, true)
    window.addEventListener('blur', reset)
    document.addEventListener('visibilitychange', visibility)
  })
  onBeforeUnmount(() => {
    disposed = true
    reset()
    document.removeEventListener('pointerdown', pointerDown, true)
    window.removeEventListener('pointerup', pointerEnd, true)
    window.removeEventListener('pointercancel', pointerEnd, true)
    document.removeEventListener('click', click)
    document.removeEventListener('input', input, true)
    window.removeEventListener('blur', reset)
    document.removeEventListener('visibilitychange', visibility)
  })
}
