<script setup lang="ts">
definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const { user, fetch: refreshSession } = useUserSession()

type SettingsTab = 'profile' | 'password'

useSeoMeta({
  title: 'Ajustes | Pink & Black',
})

const activeTab = ref<SettingsTab>('profile')

const profile = reactive({
  name: user.value?.name ?? '',
  motorcycle: user.value?.motorcycle ?? '',
})

const passwords = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileLoading = ref(false)
const passwordLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')

const tabs = [
  { id: 'profile' as const, label: 'Perfil', icon: 'person' },
  { id: 'password' as const, label: 'Contraseña', icon: 'lock' },
]

watch(
  () => user.value,
  (value) => {
    if (!value) return
    profile.name = value.name
    profile.motorcycle = value.motorcycle ?? ''
  },
)

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = tab === 'password' ? 'password' : 'profile'
  },
  { immediate: true },
)

function setTab(tab: SettingsTab) {
  activeTab.value = tab
  void router.replace({
    query: tab === 'profile' ? {} : { tab },
  })
}

async function saveProfile() {
  profileLoading.value = true
  profileError.value = ''
  profileSuccess.value = ''

  try {
    await $fetch('/api/me', {
      method: 'PATCH',
      body: {
        name: profile.name,
        motorcycle: profile.motorcycle,
      },
    })
    await refreshSession()
    profileSuccess.value = 'Perfil actualizado'
  }
  catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; statusMessage?: string }
    profileError.value =
      fetchError.data?.statusMessage
      ?? fetchError.statusMessage
      ?? 'No se pudo guardar el perfil'
  }
  finally {
    profileLoading.value = false
  }
}

async function savePassword() {
  passwordLoading.value = true
  passwordError.value = ''
  passwordSuccess.value = ''

  if (passwords.newPassword !== passwords.confirmPassword) {
    passwordError.value = 'La confirmación no coincide'
    passwordLoading.value = false
    return
  }

  if (passwords.newPassword === passwords.currentPassword) {
    passwordError.value = 'La nueva contraseña debe ser diferente a la actual'
    passwordLoading.value = false
    return
  }

  try {
    const result = await $fetch<{ message: string }>('/api/me/password', {
      method: 'POST',
      body: {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      },
    })
    passwordSuccess.value = result.message
    passwords.currentPassword = ''
    passwords.newPassword = ''
    passwords.confirmPassword = ''
  }
  catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; statusMessage?: string }
    passwordError.value =
      fetchError.data?.statusMessage
      ?? fetchError.statusMessage
      ?? 'No se pudo cambiar la contraseña'
  }
  finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="relative flex w-full flex-col space-y-section-gap p-gutter-mobile md:p-gutter-desktop">
    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <span class="h-[2px] w-12 bg-primary" />
        <span class="font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary">
          Cuenta
        </span>
      </div>
      <h1 class="font-headline-xl text-3xl text-on-surface md:text-headline-xl">
        AJUSTES
      </h1>
      <p class="max-w-xl text-on-surface-variant">
        Actualiza tu identidad en la hermandad y protege el acceso a tu cuenta.
      </p>
    </div>

    <div class="max-w-2xl">
      <div class="mb-6 flex rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider transition-all"
          :class="
            activeTab === tab.id
              ? 'bg-primary text-on-primary shadow-lg'
              : 'text-on-surface-variant hover:text-on-surface'
          "
          @click="setTab(tab.id)"
        >
          <MaterialIcon
            :name="tab.icon"
            class="text-base"
          />
          {{ tab.label }}
        </button>
      </div>

      <section
        v-if="activeTab === 'profile'"
        class="space-y-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest/50 p-6 md:p-8"
      >
        <div>
          <h2 class="font-headline-lg text-xl text-on-surface">
            Perfil
          </h2>
          <p class="mt-1 text-sm text-on-surface-variant">
            {{ user?.email }}
          </p>
        </div>

        <form
          class="space-y-5"
          @submit.prevent="saveProfile"
        >
          <FloatingLabelInput
            id="settings-name"
            v-model="profile.name"
            label="NOMBRE"
            required
          />
          <FloatingLabelInput
            id="settings-moto"
            v-model="profile.motorcycle"
            label="TU MÁQUINA"
          />

          <p
            v-if="profileError"
            class="font-label-sm text-label-sm text-error"
          >
            {{ profileError }}
          </p>
          <p
            v-if="profileSuccess"
            class="font-label-sm text-label-sm text-primary"
          >
            {{ profileSuccess }}
          </p>

          <AppButton
            type="submit"
            :disabled="profileLoading"
          >
            {{ profileLoading ? 'Guardando…' : 'Guardar perfil' }}
          </AppButton>
        </form>
      </section>

      <section
        v-else
        class="space-y-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest/50 p-6 md:p-8"
      >
        <div>
          <h2 class="font-headline-lg text-xl text-on-surface">
            Cambiar contraseña
          </h2>
          <p class="mt-1 text-sm text-on-surface-variant">
            Usa al menos 8 caracteres. Si un admin te dio una contraseña temporal, cámbiala aquí.
          </p>
        </div>

        <form
          class="space-y-5"
          @submit.prevent="savePassword"
        >
          <FloatingLabelInput
            id="settings-current-password"
            v-model="passwords.currentPassword"
            type="password"
            label="CONTRASEÑA ACTUAL"
            autocomplete="current-password"
            show-password-toggle
            required
          />
          <FloatingLabelInput
            id="settings-new-password"
            v-model="passwords.newPassword"
            type="password"
            label="NUEVA CONTRASEÑA"
            autocomplete="new-password"
            show-password-toggle
            required
          />
          <FloatingLabelInput
            id="settings-confirm-password"
            v-model="passwords.confirmPassword"
            type="password"
            label="CONFIRMAR CONTRASEÑA"
            autocomplete="new-password"
            show-password-toggle
            required
          />

          <p
            v-if="passwordError"
            class="font-label-sm text-label-sm text-error"
          >
            {{ passwordError }}
          </p>
          <p
            v-if="passwordSuccess"
            class="font-label-sm text-label-sm text-primary"
          >
            {{ passwordSuccess }}
          </p>

          <AppButton
            type="submit"
            :disabled="passwordLoading"
          >
            {{ passwordLoading ? 'Actualizando…' : 'Cambiar contraseña' }}
          </AppButton>
        </form>
      </section>
    </div>
  </div>
</template>
