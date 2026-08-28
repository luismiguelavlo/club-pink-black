<script setup lang="ts">
type Pilot = {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  motorcycle: string | null
  isActive: boolean
  createdAt: string
}

type Invite = {
  id: string
  code: string
  email: string | null
  role: 'admin' | 'user'
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
  inviteUrl: string
}

type Activity = {
  id: string
  kind: 'joined' | 'invited'
  title: string
  subtitle: string
  createdAt: string
}

type DashboardPayload = {
  invites: Invite[]
  pendingCount: number
  membersCount: number
  pilots: Pilot[]
  activity: Activity[]
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { user } = useUserSession()
const search = ref('')
const createOpen = ref(false)
const readyOpen = ref(false)
const generatedInvite = ref<Invite | null>(null)
const actionError = ref('')
const page = ref(1)
const pageSize = 8
const busyUserId = ref<string | null>(null)
const tempPassword = ref<{ name: string; password: string } | null>(null)
const tempPasswordOpen = computed({
  get: () => Boolean(tempPassword.value),
  set: (value: boolean) => {
    if (!value) tempPassword.value = null
  },
})

const { data, refresh, pending, error } = await useFetch<DashboardPayload>('/api/admin/invites', {
  key: 'admin-invites-dashboard',
})

useSeoMeta({
  title: 'Pilotos e invitaciones | Pink & Black',
})

const filteredPilots = computed(() => {
  const query = search.value.trim().toLowerCase()
  const pilots = data.value?.pilots ?? []
  if (!query) return pilots
  return pilots.filter((pilot) => {
    return (
      pilot.name.toLowerCase().includes(query) ||
      pilot.email.toLowerCase().includes(query) ||
      (pilot.motorcycle ?? '').toLowerCase().includes(query)
    )
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPilots.value.length / pageSize)))

const pagedPilots = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredPilots.value.slice(start, start + pageSize)
})

const pendingInvites = computed(() =>
  (data.value?.invites ?? []).filter((invite) => invite.status === 'pending'),
)

watch(search, () => {
  page.value = 1
})

function roleLabel(role: 'admin' | 'user') {
  return role === 'admin' ? 'Administrador' : 'Piloto'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatRelative(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `hace ${Math.max(1, minutes)} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

function remainingLabel(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Expirada'
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function onInviteCreated(invite: Invite) {
  generatedInvite.value = invite
  readyOpen.value = true
  void refresh()
}

async function copyInvite(invite: Invite) {
  try {
    await navigator.clipboard.writeText(invite.inviteUrl)
  } catch {
    actionError.value = 'No se pudo copiar el enlace'
  }
}

async function revoke(invite: Invite) {
  actionError.value = ''
  try {
    await $fetch(`/api/admin/invites/${invite.id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    actionError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo revocar'
  }
}

async function setPilotRole(pilot: Pilot, role: 'admin' | 'user') {
  if (pilot.role === role || busyUserId.value) return
  busyUserId.value = pilot.id
  actionError.value = ''
  try {
    await $fetch(`/api/admin/users/${pilot.id}`, {
      method: 'PATCH',
      body: { role },
    })
    await refresh()
  }
  catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    actionError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo cambiar el rol'
  }
  finally {
    busyUserId.value = null
  }
}

async function togglePilotActive(pilot: Pilot) {
  if (busyUserId.value) return
  const next = !pilot.isActive
  const label = next ? 'reactivar' : 'desactivar'
  if (!window.confirm(`¿Seguro que quieres ${label} a ${pilot.name}?`)) return

  busyUserId.value = pilot.id
  actionError.value = ''
  try {
    await $fetch(`/api/admin/users/${pilot.id}`, {
      method: 'PATCH',
      body: { isActive: next },
    })
    await refresh()
  }
  catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    actionError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo actualizar el estado'
  }
  finally {
    busyUserId.value = null
  }
}

async function resetPilotPassword(pilot: Pilot) {
  if (busyUserId.value) return
  if (!window.confirm(`¿Restablecer la contraseña de ${pilot.name}?`)) return

  busyUserId.value = pilot.id
  actionError.value = ''
  tempPassword.value = null
  try {
    const result = await $fetch<{ temporaryPassword: string }>(
      `/api/admin/users/${pilot.id}/reset-password`,
      { method: 'POST' },
    )
    tempPassword.value = {
      name: pilot.name,
      password: result.temporaryPassword,
    }
  }
  catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    actionError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo restablecer la contraseña'
  }
  finally {
    busyUserId.value = null
  }
}

async function copyTempPassword() {
  if (!tempPassword.value) return
  try {
    await navigator.clipboard.writeText(tempPassword.value.password)
  }
  catch {
    actionError.value = 'No se pudo copiar la contraseña temporal'
  }
}
</script>

<template>
  <div class="relative flex w-full flex-col space-y-section-gap p-gutter-mobile md:p-gutter-desktop">
    <section class="grid grid-cols-12 items-end gap-gutter-desktop">
      <div class="col-span-12 space-y-6 lg:col-span-7">
        <div class="flex flex-col">
          <span class="mb-2 font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
            Protocolo: Membresía
          </span>
          <h1 class="font-headline-xl text-3xl leading-none text-on-background md:text-headline-xl">
            Gestión de Hermandad
          </h1>
        </div>

        <div class="group relative max-w-xl">
          <div class="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <MaterialIcon
              name="search"
              class="text-primary/60 transition-colors group-focus-within:text-primary"
            />
          </div>
          <input
            v-model="search"
            class="w-full border-b-2 border-outline-variant/30 bg-surface-container-low py-4 pl-12 pr-4 font-label-sm text-on-surface transition-all placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none"
            placeholder="BUSCAR PILOTO POR NOMBRE O MOTO..."
            type="search"
          >
        </div>
      </div>

      <div class="col-span-12 grid grid-cols-2 gap-4 lg:col-span-5">
        <div class="relative overflow-hidden rounded-xl border-l-2 border-primary bg-surface-container/40 p-6 shadow-xl backdrop-blur-xl">
          <p class="mb-1 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
            Miembros totales
          </p>
          <div class="flex items-baseline gap-2">
            <span class="font-headline-xl text-3xl text-on-surface md:text-headline-xl">
              {{ (data?.membersCount ?? 0).toString().padStart(2, '0') }}
            </span>
          </div>
        </div>
        <div class="relative overflow-hidden rounded-xl border-l-2 border-outline-variant bg-surface-container/40 p-6 shadow-xl backdrop-blur-xl">
          <p class="mb-1 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
            Invitaciones pendientes
          </p>
          <div class="flex items-baseline gap-2">
            <span class="font-headline-xl text-3xl text-primary md:text-headline-xl">
              {{ (data?.pendingCount ?? 0).toString().padStart(2, '0') }}
            </span>
            <span class="text-xs font-bold uppercase text-on-surface-variant/40">
              En espera
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-12 gap-gutter-desktop">
      <div class="col-span-12 space-y-6 lg:col-span-4">
        <div class="relative overflow-hidden rounded-2xl border-l border-t border-white/5 bg-surface-container-highest/20 p-8 backdrop-blur-md">
          <div class="absolute right-0 top-0 p-4">
            <MaterialIcon
              name="bolt"
              class="scale-150 text-primary/20"
            />
          </div>
          <h2 class="mb-4 font-headline-lg text-headline-lg text-on-surface">
            Reclutar
          </h2>
          <p class="mb-8 text-sm leading-relaxed text-on-surface-variant">
            Expande el círculo. Genera un código de acceso único con validez de 24 horas para nuevos prospectos de la hermandad.
          </p>
          <button
            type="button"
            class="group flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-6 py-4 font-label-sm text-on-primary transition-all hover:shadow-[0_0_30px_rgba(255,176,202,0.5)] active:scale-95"
            @click="createOpen = true"
          >
            <MaterialIcon
              name="key"
              class="transition-transform group-hover:rotate-45"
            />
            GENERAR INVITACIÓN
          </button>

          <div
            v-if="generatedInvite"
            class="mt-6"
          >
            <div class="flex items-center justify-between rounded-lg border border-primary/30 bg-black/40 p-4">
              <code class="font-label-sm text-lg text-primary">
                {{ generatedInvite.code }}
              </code>
              <button
                type="button"
                class="text-on-surface-variant transition-colors hover:text-primary"
                aria-label="Copiar enlace de invitación"
                @click="copyInvite(generatedInvite)"
              >
                <MaterialIcon name="content_copy" />
              </button>
            </div>
            <p class="mt-2 text-center font-label-sm text-[10px] uppercase tracking-tighter text-on-surface-variant">
              Expira en
              <span class="text-primary">{{ remainingLabel(generatedInvite.expiresAt) }}</span>
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <h3 class="mb-4 font-label-sm text-xs uppercase tracking-widest text-primary">
            Actividad Reciente
          </h3>
          <div class="space-y-4">
            <div
              v-for="item in data?.activity ?? []"
              :key="item.id"
              class="flex items-center gap-3"
            >
              <div
                class="h-8 w-1 rounded-full"
                :class="item.kind === 'joined' ? 'bg-primary' : 'bg-outline-variant/30'"
              />
              <div>
                <p class="text-xs font-bold text-on-surface">
                  {{ item.title }}
                </p>
                <p class="text-[10px] uppercase text-on-surface-variant">
                  {{ item.subtitle }} · {{ formatRelative(item.createdAt) }}
                </p>
              </div>
            </div>
            <p
              v-if="!(data?.activity?.length)"
              class="text-xs text-on-surface-variant"
            >
              Sin actividad todavía.
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-outline-variant/10 bg-surface-container/20 p-6">
          <h3 class="mb-4 font-label-sm text-xs uppercase tracking-widest text-primary">
            Invitaciones pendientes
          </h3>
          <div class="space-y-3">
            <div
              v-for="invite in pendingInvites"
              :key="invite.id"
              class="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <code class="font-label-sm text-sm text-primary">
                    {{ invite.code }}
                  </code>
                  <p class="mt-1 text-[10px] uppercase text-on-surface-variant">
                    {{ invite.email ?? 'Sin email fijo' }} · {{ invite.role }}
                  </p>
                </div>
                <div class="flex gap-1">
                  <button
                    type="button"
                    class="p-1 text-on-surface-variant hover:text-primary"
                    aria-label="Copiar"
                    @click="copyInvite(invite)"
                  >
                    <MaterialIcon name="content_copy" />
                  </button>
                  <button
                    type="button"
                    class="p-1 text-on-surface-variant hover:text-error"
                    aria-label="Revocar"
                    @click="revoke(invite)"
                  >
                    <MaterialIcon name="block" />
                  </button>
                </div>
              </div>
            </div>
            <p
              v-if="!pendingInvites.length"
              class="text-xs text-on-surface-variant"
            >
              No hay invitaciones pendientes.
            </p>
          </div>
          <p
            v-if="actionError"
            class="mt-3 font-label-sm text-label-sm text-error"
          >
            {{ actionError }}
          </p>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-8">
        <div class="overflow-hidden rounded-2xl border border-white/5 bg-surface-container/20 backdrop-blur-sm">
          <div class="flex items-center justify-between border-b border-outline-variant/10 p-6">
            <h2 class="font-headline-lg text-xl text-on-surface md:text-headline-lg">
              Directorio de Pilotos
            </h2>
          </div>

          <p
            v-if="error"
            class="p-6 font-label-sm text-label-sm text-error"
          >
            No se pudo cargar el directorio.
          </p>
          <p
            v-else-if="pending"
            class="p-6 text-on-surface-variant"
          >
            Cargando…
          </p>

          <div
            v-else
            class="overflow-x-auto"
          >
            <table class="w-full min-w-[760px] border-collapse">
              <thead>
                <tr class="bg-surface-container-high/40">
                  <th class="px-6 py-4 text-left font-label-sm text-xs uppercase tracking-widest text-on-surface-variant">
                    Piloto
                  </th>
                  <th class="px-6 py-4 text-left font-label-sm text-xs uppercase tracking-widest text-on-surface-variant">
                    Moto
                  </th>
                  <th class="px-6 py-4 text-left font-label-sm text-xs uppercase tracking-widest text-on-surface-variant">
                    Estatus
                  </th>
                  <th class="px-6 py-4 text-left font-label-sm text-xs uppercase tracking-widest text-on-surface-variant">
                    Registro
                  </th>
                  <th class="px-6 py-4 text-right font-label-sm text-xs uppercase tracking-widest text-on-surface-variant">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr
                  v-for="pilot in pagedPilots"
                  :key="pilot.id"
                  class="group transition-colors hover:bg-primary/5"
                >
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-surface-container-highest font-label-sm text-primary"
                      >
                        {{ pilot.name.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <p class="font-bold text-on-surface transition-colors group-hover:text-primary">
                          {{ pilot.name }}
                        </p>
                        <p class="text-[10px] uppercase text-on-surface-variant">
                          {{ pilot.email }} · {{ roleLabel(pilot.role) }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5 font-label-sm text-sm text-on-surface">
                    {{ pilot.motorcycle || '—' }}
                  </td>
                  <td class="px-6 py-5">
                    <span
                      class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tighter"
                      :class="
                        pilot.isActive
                          ? 'border-primary/30 bg-primary/20 text-primary'
                          : 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant'
                      "
                    >
                      <span
                        class="mr-2 h-1.5 w-1.5 rounded-full"
                        :class="pilot.isActive ? 'animate-pulse bg-primary' : 'bg-on-surface-variant'"
                      />
                      {{ pilot.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-6 py-5 font-label-sm text-sm text-on-surface-variant">
                    {{ formatDate(pilot.createdAt) }}
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        class="font-label-sm text-[10px] uppercase tracking-wider text-primary hover:underline disabled:opacity-40"
                        :disabled="busyUserId === pilot.id || pilot.id === user?.id"
                        @click="setPilotRole(pilot, pilot.role === 'admin' ? 'user' : 'admin')"
                      >
                        {{ pilot.role === 'admin' ? 'Quitar admin' : 'Hacer admin' }}
                      </button>
                      <button
                        type="button"
                        class="font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant hover:text-primary disabled:opacity-40"
                        :disabled="busyUserId === pilot.id || pilot.id === user?.id"
                        @click="togglePilotActive(pilot)"
                      >
                        {{ pilot.isActive ? 'Desactivar' : 'Reactivar' }}
                      </button>
                      <button
                        type="button"
                        class="font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant hover:text-primary disabled:opacity-40"
                        :disabled="busyUserId === pilot.id"
                        @click="resetPilotPassword(pilot)"
                      >
                        Reset pwd
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!pagedPilots.length">
                  <td
                    colspan="5"
                    class="px-6 py-10 text-center text-on-surface-variant"
                  >
                    No hay pilotos que coincidan con la búsqueda.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-high/20 p-6">
            <p class="font-label-sm text-xs text-on-surface-variant">
              MOSTRANDO {{ pagedPilots.length }} DE {{ filteredPilots.length }} PILOTOS
            </p>
            <div class="flex gap-4">
              <button
                type="button"
                class="font-label-sm text-xs text-on-surface-variant transition-colors hover:text-primary disabled:opacity-30"
                :disabled="page <= 1"
                @click="page -= 1"
              >
                ANTERIOR
              </button>
              <button
                type="button"
                class="font-label-sm text-xs text-primary transition-colors hover:underline disabled:opacity-30"
                :disabled="page >= totalPages"
                @click="page += 1"
              >
                SIGUIENTE
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="pointer-events-none fixed left-1/2 top-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
    <div class="pointer-events-none fixed bottom-0 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[80px]" />

    <InviteCreateModal
      v-model:open="createOpen"
      @created="onInviteCreated"
    />
    <InviteReadyModal
      v-model:open="readyOpen"
      :invite="generatedInvite"
    />

    <AdminModal
      v-model:open="tempPasswordOpen"
      title="Contraseña temporal"
      description="Compártela de forma segura. El piloto debería cambiarla en Ajustes."
    >
      <div
        v-if="tempPassword"
        class="space-y-4"
      >
        <p class="text-sm text-on-surface-variant">
          Nueva contraseña para <span class="text-on-surface">{{ tempPassword.name }}</span>
        </p>
        <code class="block rounded-lg bg-surface-container-high px-4 py-3 font-mono text-primary">
          {{ tempPassword.password }}
        </code>
        <AppButton
          block
          @click="copyTempPassword"
        >
          Copiar contraseña
        </AppButton>
      </div>
    </AdminModal>
  </div>
</template>
