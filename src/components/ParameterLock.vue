<script setup>
import AppIcon from './AppIcon.vue'
defineProps({ locked: Boolean, label: String })
defineEmits(['toggle'])
</script>
<template>
  <button class="parameter-lock" :class="{ selected: locked }" :aria-pressed="locked" :aria-label="`${locked ? 'Unlock' : 'Lock'} ${label}`" :title="locked ? 'Keep during randomization' : 'Lock against randomization'" @click="$emit('toggle')">
    <AppIcon :name="locked ? 'lock' : 'unlock'" :size="14" />
  </button>
</template>
