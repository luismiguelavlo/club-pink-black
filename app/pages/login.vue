<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
  layout: false,
})

const { fetch: refreshSession } = useUserSession()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

useSeoMeta({
  title: 'Iniciar sesión | Pink & Black',
  description: 'Acceso exclusivo para miembros del club.',
})

onMounted(() => {
  if (route.query.pending === '1') {
    successMessage.value =
      'Cuenta creada. Un administrador debe activarla antes de que puedas iniciar sesión.'
  }
})

async function onSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
      },
    })

    await refreshSession()

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    const fallback = '/feed'

    await router.push(redirect && redirect.startsWith('/') ? redirect : fallback)
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }; statusMessage?: string }
    errorMessage.value =
      err.data?.statusMessage ?? err.statusMessage ?? 'No se pudo iniciar sesión'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-gutter-mobile py-16 md:px-gutter-desktop">
    <div
      class="pointer-events-none absolute inset-0 opacity-40"
      style="background:
        radial-gradient(ellipse 60% 40% at 20% 20%, rgba(255, 71, 156, 0.18), transparent),
        radial-gradient(ellipse 50% 35% at 80% 80%, rgba(255, 176, 202, 0.12), transparent);"
    />

    <div class="relative z-10 w-full max-w-md">
      <NuxtLink
        to="/"
        class="mb-10 block text-center font-headline-xl text-2xl font-bold uppercase italic tracking-tighter text-primary md:text-3xl"
      >
        Pink &amp; Black
      </NuxtLink>

      <div class="glass-panel p-8 md:p-10">
        <h1 class="font-headline-lg text-headline-lg text-on-surface">
          Iniciar sesión
        </h1>
        <p class="mt-2 font-body-md text-body-md text-secondary">
          Solo miembros registrados. No hay alta pública.
        </p>

        <form
          class="mt-8 flex flex-col gap-8"
          @submit.prevent="onSubmit"
        >
          <FloatingLabelInput
            id="login-email"
            v-model="email"
            type="email"
            label="Correo"
            autocomplete="username"
            required
          />

          <FloatingLabelInput
            id="login-password"
            v-model="password"
            type="password"
            label="Contraseña"
            autocomplete="current-password"
            required
          />

          <p
            v-if="successMessage"
            class="font-label-sm text-label-sm text-primary"
            role="status"
          >
            {{ successMessage }}
          </p>

          <p
            v-if="errorMessage"
            class="font-label-sm text-label-sm text-error"
            role="alert"
          >
            {{ errorMessage }}
          </p>

          <AppButton
            type="submit"
            variant="primary"
            shape="chamfer"
            block
            :aria-label="isSubmitting ? 'Entrando' : 'Entrar'"
          >
            {{ isSubmitting ? 'Entrando…' : 'Entrar' }}
          </AppButton>
        </form>
      </div>

      <p class="mt-6 text-center font-label-sm text-label-sm text-secondary">
        <NuxtLink
          to="/"
          class="text-primary hover:underline"
        >
          Volver al sitio
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
