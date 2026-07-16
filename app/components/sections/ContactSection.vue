<script setup lang="ts">
import type { JoinFormPayload } from '~/types/site'
import { contactContent } from '~/data/site'

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    submitLabel?: string
  }>(),
  {
    title: contactContent.title,
    subtitle: contactContent.subtitle,
    submitLabel: contactContent.submitLabel,
  },
)

const emit = defineEmits<{
  submit: [payload: JoinFormPayload]
}>()

const form = reactive<JoinFormPayload>({
  name: '',
  machine: '',
  email: '',
})

function handleSubmit() {
  emit('submit', { ...form })
  form.name = ''
  form.machine = ''
  form.email = ''
}
</script>

<template>
  <section
    id="contact"
    class="relative px-gutter-mobile py-section-gap md:px-gutter-desktop"
  >
    <div class="mx-auto max-w-3xl text-center">
      <h2 class="font-headline-xl mb-4 text-on-surface">
        {{ title }}
      </h2>
      <p class="font-body-md mb-10 text-secondary">
        {{ subtitle }}
      </p>

      <form
        class="space-y-6 text-left"
        @submit.prevent="handleSubmit"
      >
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FloatingLabelInput
            id="name"
            v-model="form.name"
            label="PILOT NAME"
            autocomplete="name"
            required
          />
          <FloatingLabelInput
            id="machine"
            v-model="form.machine"
            label="YOUR MACHINE (MODEL)"
            required
          />
        </div>

        <FloatingLabelInput
          id="email"
          v-model="form.email"
          type="email"
          label="COMMS CHANNEL (EMAIL)"
          autocomplete="email"
          required
        />

        <div class="pt-6">
          <AppButton
            type="submit"
            block
            size="lg"
          >
            {{ submitLabel }}
          </AppButton>
        </div>
      </form>
    </div>
  </section>
</template>
