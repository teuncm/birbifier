<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
const props = defineProps({ modelValue: String, presets: Array })
const emit = defineEmits(['update:modelValue', 'previous', 'next'])
const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>
<template>
  <section class="panel min-w-0 px-3 pb-3 pt-1" aria-labelledby="presets-heading">
    <h2 id="presets-heading" class="flex min-h-7 items-center gap-2 text-sm font-semibold leading-tight"><AppIcon name="spark" :size="17" />Presets</h2>
    <div class="mt-1 grid grid-cols-2 items-center gap-2 lg:flex">
      <button class="icon-button w-full lg:w-11" aria-label="Previous preset" @click="emit('previous')"><AppIcon name="left" :size="18" /></button>
      <select id="preset" v-model="selected" aria-labelledby="presets-heading" class="preset-select order-first col-span-2 min-w-0 px-2 lg:order-none lg:flex-1 lg:px-3">
        <option v-if="!modelValue" value="" disabled>Custom</option>
        <option v-for="preset in presets" :key="preset.name" :value="preset.name">{{ preset.name }}</option>
      </select>
      <button class="icon-button w-full lg:w-11" aria-label="Next preset" @click="emit('next')"><AppIcon name="right" :size="18" /></button>
    </div>
  </section>
</template>
