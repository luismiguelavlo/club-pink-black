<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
  layout: false,
})

const route = useRoute()
const router = useRouter()
const { fetch: refreshSession } = useUserSession()

const code = computed(() => String(route.params.code ?? '').toUpperCase())

const {
  data,
  error: inviteError,
  pending,
} = await useFetch<{
  invite: {
    code: string
    email: string | null
    role: 'admin' | 'user'
    expiresAt: string
  }
}>(() => `/api/invites/${code.value}`, {
  key: () => `invite-${code.value}`,
  watch: [code],
})

const name = ref('')
const email = ref('')
const password = ref('')
const motorcycle = ref('')
const formError = ref('')
const isSubmitting = ref(false)

watch(
  () => data.value?.invite.email,
  (lockedEmail) => {
    if (lockedEmail) email.value = lockedEmail
  },
  { immediate: true },
)

useSeoMeta({
  title: 'Aceptar invitación | Pink & Black',
})

const expiresLabel = computed(() => {
  if (!data.value?.invite.expiresAt) return ''
  return new Date(data.value.invite.expiresAt).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
})

async function onSubmit() {
  formError.value = ''
  isSubmitting.value = true

  try {
    const response = await $fetch<{
      user: { role: 'admin' | 'user' }
      pendingApproval?: boolean
    }>(`/api/invites/${code.value}/accept`, {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value,
        motorcycle: motorcycle.value,
      },
    })

    if (response.pendingApproval) {
      await router.push({ path: '/login', query: { pending: '1' } })
      return
    }

    await refreshSession()
    await router.push('/feed')
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }; statusMessage?: string }
    formError.value =
      err.data?.statusMessage ?? err.statusMessage ?? 'No se pudo crear la cuenta'
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
        <p class="font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary">
          Invitación
        </p>
        <h1 class="mt-2 font-headline-lg text-headline-lg text-on-surface">
          Crear cuenta
        </h1>

        <div
          v-if="pending"
          class="mt-8 text-secondary"
        >
          Validando código…
        </div>

        <div
          v-else-if="inviteError"
          class="mt-8"
        >
          <p class="font-label-sm text-label-sm text-error">
            {{
              (inviteError as { data?: { statusMessage?: string }; statusMessage?: string }).data
                ?.statusMessage
                ?? (inviteError as { statusMessage?: string }).statusMessage
                ?? 'Invitación inválida'
            }}
          </p>
          <AppButton
            class="mt-6"
            href="/login"
            variant="outline"
            block
          >
            Ir a iniciar sesión
          </AppButton>
        </div>

        <template v-else>
          <p class="mt-2 font-body-md text-body-md text-secondary">
            Código
            <span class="text-primary">{{ data?.invite.code }}</span>
            · expira {{ expiresLabel }}
          </p>
          <p class="mt-3 font-label-sm text-label-sm text-on-surface-variant">
            Tras registrarte, un administrador debe activar tu cuenta antes de que puedas iniciar sesión.
          </p>

          <form
            class="mt-8 flex flex-col gap-8"
            @submit.prevent="onSubmit"
          >
            <FloatingLabelInput
              id="invite-name"
              v-model="name"
              label="Nombre / alias"
              autocomplete="nickname"
              required
            />
            <FloatingLabelInput
              id="invite-register-email"
              v-model="email"
              type="email"
              label="Correo"
              autocomplete="email"
              required
              :disabled="Boolean(data?.invite.email)"
            />
            <FloatingLabelInput
              id="invite-password"
              v-model="password"
              type="password"
              label="Contraseña"
              autocomplete="new-password"
              required
            />
            <FloatingLabelInput
              id="invite-moto"
              v-model="motorcycle"
              label="Moto (opcional)"
              autocomplete="off"
            />

            <p
              v-if="formError"
              class="font-label-sm text-label-sm text-error"
              role="alert"
            >
              {{ formError }}
            </p>

            <AppButton
              type="submit"
              variant="primary"
              shape="chamfer"
              block
            >
              {{ isSubmitting ? 'Creando…' : 'Crear cuenta' }}
            </AppButton>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>
