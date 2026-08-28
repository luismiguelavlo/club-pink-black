<script setup lang="ts">
const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    type?: 'text' | 'email' | 'tel' | 'url' | 'password'
    required?: boolean
    autocomplete?: string
    disabled?: boolean
    showPasswordToggle?: boolean
  }>(),
  {
    type: 'text',
    required: false,
    disabled: false,
    showPasswordToggle: false,
  },
)

const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type !== 'password') return props.type
  return showPassword.value ? 'text' : 'password'
})
</script>

<template>
  <div class="relative">
    <input
      :id="props.id"
      v-model="model"
      :type="inputType"
      :required="props.required"
      :autocomplete="props.autocomplete"
      :disabled="props.disabled"
      placeholder=" "
      class="peer w-full border-0 border-b border-outline-variant bg-transparent px-0 py-3 font-body-md text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
      :class="showPasswordToggle && props.type === 'password' ? 'pr-10' : ''"
    >
    <label
      :for="props.id"
      class="pointer-events-none absolute left-0 top-3 font-label-sm text-secondary transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs"
    >
      {{ props.label }}
    </label>
    <button
      v-if="showPasswordToggle && props.type === 'password'"
      type="button"
      class="absolute right-0 top-3 text-on-surface-variant transition-colors hover:text-primary"
      :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      @click="showPassword = !showPassword"
    >
      <MaterialIcon
        :name="showPassword ? 'visibility_off' : 'visibility'"
        class="text-xl"
      />
    </button>
  </div>
</template>
