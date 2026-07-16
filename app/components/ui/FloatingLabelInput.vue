<script setup lang="ts">
const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    type?: 'text' | 'email' | 'tel' | 'url'
    required?: boolean
    autocomplete?: string
  }>(),
  {
    type: 'text',
    required: false,
  },
)
</script>

<template>
  <div class="relative">
    <input
      :id="props.id"
      v-model="model"
      :type="props.type"
      :required="props.required"
      :autocomplete="props.autocomplete"
      placeholder=" "
      class="peer w-full border-0 border-b border-outline-variant bg-transparent px-0 py-3 font-body-md text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-0"
    >
    <label
      :for="props.id"
      class="pointer-events-none absolute left-0 top-3 font-label-sm text-secondary transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs"
    >
      {{ props.label }}
    </label>
  </div>
</template>
