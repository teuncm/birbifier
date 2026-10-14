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
  <section class="panel p-5" aria-labelledby="presets-heading">
    <h2 id="presets-heading" class="flex items-center gap-2 text-sm font-semibold"><AppIcon name="spark" :size="17" />Presets</h2>
    <div class="mt-4 flex items-center gap-2">
      <button class="icon-button" aria-label="Previous preset" @click="emit('previous')"><AppIcon name="left" :size="18" /></button>
      <select id="preset" v-model="selected" aria-labelledby="presets-heading" class="preset-select min-w-0 flex-1">
        <option v-if="!modelValue" value="" disabled>Custom</option>
        <option v-for="preset in presets" :key="preset.name" :value="preset.name">{{ preset.name }}</option>
      </select>
      <button class="icon-button" aria-label="Next preset" @click="emit('next')"><AppIcon name="right" :size="18" /></button>
    </div>
  </section>
</template>
