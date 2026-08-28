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

const form = reactive<JoinFormPayload>({
  name: '',
  machine: '',
  email: '',
})

const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleSubmit() {
  if (loading.value) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const result = await $fetch<{ message: string }>('/api/public/contact', {
      method: 'POST',
      body: { ...form },
    })

    success.value = result.message
    form.name = ''
    form.machine = ''
    form.email = ''
  }
  catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; statusMessage?: string }
    error.value =
      fetchError.data?.statusMessage
      ?? fetchError.statusMessage
      ?? 'No se pudo enviar la solicitud'
  }
  finally {
    loading.value = false
  }
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
            label="NOMBRE DEL PILOTO"
            autocomplete="name"
            required
          />
          <FloatingLabelInput
            id="machine"
            v-model="form.machine"
            label="TU MÁQUINA (MODELO)"
            required
          />
        </div>

        <FloatingLabelInput
          id="email"
          v-model="form.email"
          type="email"
          label="CANAL DE CONTACTO (EMAIL)"
          autocomplete="email"
          required
        />

        <p
          v-if="error"
          class="font-body-md text-sm text-error"
        >
          {{ error }}
        </p>
        <p
          v-if="success"
          class="font-body-md text-sm text-primary"
        >
          {{ success }}
        </p>

        <div class="pt-6">
          <AppButton
            type="submit"
            block
            size="lg"
            :disabled="loading"
          >
            {{ loading ? 'Enviando…' : submitLabel }}
          </AppButton>
        </div>
      </form>
    </div>
  </section>
</template>
