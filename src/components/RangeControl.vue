<script setup>
import { computed } from 'vue'
import ParameterLock from './ParameterLock.vue'
const props = defineProps({
  modelValue: Number, id: String, label: String, min: Number, max: Number,
  step: { type: Number, default: 1 }, unit: { type: String, default: '' },
  scale: { type: Number, default: 1 }, minLabel: String, maxLabel: String,
  locked: Boolean, lockLabel: String,
  expanded: { type: Boolean, default: true },
})
defineEmits(['update:modelValue', 'toggle-lock'])
const valueLabel = computed(() => `${Number((props.modelValue * props.scale).toFixed(2)).toLocaleString()}${props.unit === '%' ? '%' : ` ${props.unit}`}`)
const fill = computed(() => `${(props.modelValue - props.min) / (props.max - props.min) * 100}%`)
</script>
<template>
  <div class="range-control">
    <div class="flex items-center justify-between gap-2" :class="{ 'mb-3': expanded }">
      <label :id="`${id}-label`" :for="expanded ? id : undefined" class="text-sm font-medium">{{ label }}</label>
      <div class="flex items-center gap-1">
        <output :for="expanded ? id : undefined" :aria-labelledby="`${id}-label`" :data-parameter="id" class="value-readout">{{ valueLabel }}</output>
        <ParameterLock :locked="locked" :label="lockLabel || label" @toggle="$emit('toggle-lock')" />
      </div>
    </div>
    <input v-if="expanded" :id="id" type="range" :min="min" :max="max" :step="step" :value="modelValue" :aria-valuetext="valueLabel" :style="{ '--fill': fill }" @input="$emit('update:modelValue', Number($event.target.value))" />
    <div v-if="expanded" class="mt-1 flex justify-between text-[11px] text-muted" aria-hidden="true">
      <span>{{ minLabel || `${min * scale}${unit}` }}</span><span>{{ maxLabel || `${max * scale}${unit}` }}</span>
    </div>
  </div>
</template>
