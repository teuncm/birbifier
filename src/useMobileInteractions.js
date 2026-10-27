import { onBeforeUnmount, onMounted } from 'vue'

export function useMobileInteractions() {
  function preventZoom(event) {
    // Safari exposes gesture events; other touch browsers expose touch lists.
    // Leave single-finger scrolling and native control gestures untouched.
    if (event.cancelable && (event.type.startsWith('gesture') || event.touches.length > 1)) event.preventDefault()
  }
  function preventSelection(event) {
    // Keep the manual share-link fallback copyable.
    if (!event.target.closest?.('.select-text')) event.preventDefault()
  }
  const zoomEvents = ['gesturestart', 'gesturechange', 'touchstart', 'touchmove']
  onMounted(() => {
    for (const type of zoomEvents) document.addEventListener(type, preventZoom, { passive: false })
    document.addEventListener('selectstart', preventSelection)
  })
  onBeforeUnmount(() => {
    for (const type of zoomEvents) document.removeEventListener(type, preventZoom)
    document.removeEventListener('selectstart', preventSelection)
  })
}
