<script setup>
import { computed } from 'vue'
import ParameterLock from './ParameterLock.vue'
const props = defineProps({
  modelValue: Number, id: String, label: String, min: Number, max: Number,
  step: { type: [Number, String], default: 1 }, unit: { type: String, default: '' },
  scale: { type: Number, default: 1 },
  locked: Boolean, lockLabel: String,
  expanded: { type: Boolean, default: true },
})
defineEmits(['update:modelValue', 'toggle-lock'])
const valueLabel = computed(() => {
  const value = props.unit === 'dB' ? 20 * Math.log10(props.modelValue) : props.modelValue * props.scale
  return `${Number(value.toFixed(2)).toLocaleString()}${props.unit === '%' ? '%' : ` ${props.unit}`}`
})
const fill = computed(() => `${(props.modelValue - props.min) / (props.max - props.min) * 100}%`)
</script>
<template>
  <div class="range-control">
    <div class="flex items-center justify-between gap-2" :class="{ 'mb-1': expanded }">
      <label :id="`${id}-label`" :for="expanded ? id : undefined" class="text-sm font-medium">{{ label }}</label>
      <div class="flex items-center gap-1">
        <output :for="expanded ? id : undefined" :aria-labelledby="`${id}-label`" :data-parameter="id" class="value-readout">{{ valueLabel }}</output>
        <ParameterLock :locked="locked" :label="lockLabel || label" @toggle="$emit('toggle-lock')" />
      </div>
    </div>
    <input v-if="expanded" :id="id" type="range" :min="min" :max="max" :step="step" :value="modelValue" :aria-valuetext="valueLabel" :style="{ '--fill': fill }" @input="$emit('update:modelValue', Number($event.target.value))" />
  </div>
</template>
