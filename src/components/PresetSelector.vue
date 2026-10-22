<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import AppIcon from './AppIcon.vue'
const props = defineProps({ modelValue: String, presets: Array, embedded: Boolean })
const emit = defineEmits(['update:modelValue', 'previous', 'next'])
const previousButton = ref(null)
const nextButton = ref(null)
const pressed = ref(0)
let pressTimer
function press(direction) {
  clearTimeout(pressTimer)
  pressed.value = direction
  const button = direction < 0 ? previousButton.value : nextButton.value
  button?.click()
  pressTimer = setTimeout(() => { pressed.value = 0 }, 250)
}
defineExpose({ press })
onBeforeUnmount(() => clearTimeout(pressTimer))
const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>
<template>
  <section :class="embedded ? 'min-w-0' : 'panel min-w-0 px-2 pb-2 pt-1 sm:px-3 sm:pb-3'" aria-labelledby="presets-heading">
    <h2 id="presets-heading" :class="embedded ? 'sr-only' : 'flex min-h-7 items-center text-sm font-semibold leading-tight'">Presets</h2>
    <div class="grid grid-cols-2 items-center gap-2 lg:flex" :class="{ 'mt-1': !embedded }">
      <button ref="previousButton" class="icon-button w-full lg:w-10" :class="{ 'keyboard-pressed': pressed < 0 }" aria-label="Previous preset" @click="emit('previous')"><AppIcon name="left" :size="18" /></button>
      <select id="preset" v-model="selected" aria-labelledby="presets-heading" class="preset-select order-first col-span-2 min-w-0 px-2 lg:order-none lg:flex-1 lg:px-3">
        <option v-if="!modelValue" value="" disabled>Custom</option>
        <option v-for="preset in presets" :key="preset.name" :value="preset.name">{{ preset.name }}</option>
      </select>
      <button ref="nextButton" class="icon-button w-full lg:w-10" :class="{ 'keyboard-pressed': pressed > 0 }" aria-label="Next preset" @click="emit('next')"><AppIcon name="right" :size="18" /></button>
    </div>
  </section>
</template>
