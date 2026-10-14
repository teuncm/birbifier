<script setup>
import AppIcon from './AppIcon.vue'
defineProps({ id: String, title: String, icon: { type: String, default: 'wave' }, caption: String, expanded: Boolean })
defineEmits(['toggle'])
</script>
<template>
  <section class="control-group" :aria-labelledby="`${id}-heading`">
    <h3>
      <button :id="`${id}-heading`" class="group-toggle" :aria-label="`${title} controls`" :aria-expanded="expanded" :aria-controls="id" @click="$emit('toggle')">
        <span class="flex items-center gap-2"><AppIcon :name="icon" :size="16" />{{ title }}</span>
        <span class="flex items-center gap-2"><span v-if="caption" class="text-[10px] font-normal text-muted">{{ caption }}</span><AppIcon :name="expanded ? 'up' : 'down'" :size="16" /></span>
      </button>
    </h3>
    <div :id="id" class="p-4"><slot /></div>
  </section>
</template>
