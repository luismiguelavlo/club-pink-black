<script setup lang="ts">
import { GAMES } from '~/data/games'

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

useSeoMeta({
  title: 'Juegos Arcade | Pink & Black',
})

const soloGames = computed(() => GAMES.filter((g) => !g.mode || g.mode === 'solo'))
const partyOnlineGames = computed(() => GAMES.filter((g) => g.mode === 'multiplayer'))
const partyLocalGames = computed(() => GAMES.filter((g) => g.mode === 'local'))

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    ARCADE: 'from-pink-500/20 to-purple-500/20',
    PUZZLE: 'from-cyan-500/20 to-blue-500/20',
    SHOOTER: 'from-yellow-500/20 to-orange-500/20',
    PARTY: 'from-purple-500/20 to-pink-500/20',
  }
  return colors[category] || 'from-gray-500/20 to-gray-600/20'
}
</script>

<template>
  <div class="flex w-full flex-col">
    <div class="h-1 w-full overflow-hidden bg-surface-container-highest">
      <div
        class="h-full w-1/3 bg-primary shadow-[0_0_10px_rgba(255,176,202,1)]"
      />
    </div>

    <div class="p-gutter-mobile md:p-gutter-desktop">
      <div class="mb-8">
        <h1 class="mb-3 font-headline-lg text-3xl text-on-surface md:text-4xl">
          ARCADE VAULT
        </h1>
        <p class="text-on-surface-variant">
          Arcade clásico, fiesta online y juegos para pasar el celular.
        </p>
      </div>

      <div class="mb-10">
        <h2 class="mb-4 flex items-center gap-2 font-headline-lg text-2xl text-on-surface">
          <MaterialIcon
            name="smartphone"
            class="text-primary"
          />
          Pasa el celular
        </h2>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="game in partyLocalGames"
            :key="game.id"
            :to="`/games/${game.id}`"
            class="group relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_rgba(255,176,202,0.15)]"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity group-hover:opacity-30"
              :class="getCategoryColor(game.category)"
            />
            <div class="relative">
              <h2 class="mb-1 font-headline-lg text-xl text-on-surface">
                {{ game.emoji }} {{ game.title }}
              </h2>
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary">
                {{ game.minPlayers }}-{{ game.maxPlayers }} · Un celular
              </span>
              <p class="mb-4 mt-3 text-sm text-on-surface-variant">
                {{ game.guide?.summary ?? game.description }}
              </p>
              <div class="flex items-center gap-2 text-primary">
                <span class="font-label-sm text-label-sm uppercase">Jugar</span>
                <MaterialIcon
                  name="arrow_forward"
                  class="transition-transform group-hover:translate-x-1"
                />
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <div class="mb-10">
        <h2 class="mb-4 flex items-center gap-2 font-headline-lg text-2xl text-on-surface">
          <MaterialIcon
            name="groups"
            class="text-primary"
          />
          Fiesta online
        </h2>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="game in partyOnlineGames"
            :key="game.id"
            :to="`/games/${game.id}`"
            class="group relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_rgba(255,176,202,0.15)]"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity group-hover:opacity-30"
              :class="getCategoryColor(game.category)"
            />

            <div class="relative">
              <div class="mb-4 flex items-start justify-between">
                <div>
                  <h2 class="mb-1 font-headline-lg text-xl text-on-surface">
                    {{ game.emoji }} {{ game.title }}
                  </h2>
                  <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary">
                    {{ game.minPlayers }}-{{ game.maxPlayers }} jugadores
                  </span>
                </div>
              </div>

              <p class="mb-4 text-sm text-on-surface-variant line-clamp-3">
                {{ game.guide?.summary ?? game.description }}
              </p>

              <div class="flex items-center gap-2 text-primary">
                <span class="font-label-sm text-label-sm uppercase">Crear o unirse</span>
                <MaterialIcon
                  name="arrow_forward"
                  class="transition-transform group-hover:translate-x-1"
                />
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <div class="mb-4">
        <h2 class="mb-4 flex items-center gap-2 font-headline-lg text-2xl text-on-surface">
          <MaterialIcon
            name="videogame_asset"
            class="text-primary"
          />
          Arcade clásico
        </h2>
      </div>

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="game in soloGames"
          :key="game.id"
          :to="`/games/${game.id}`"
          class="group relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_rgba(255,176,202,0.15)]"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity group-hover:opacity-30"
            :class="getCategoryColor(game.category)"
          />

          <div class="relative">
            <div class="mb-4 flex items-start justify-between">
              <div>
                <h2 class="mb-1 font-headline-lg text-xl text-on-surface">
                  {{ game.title }}
                </h2>
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary">
                  {{ game.category }}
                </span>
              </div>

              <div
                class="flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                :style="{ backgroundColor: game.color + '20' }"
              >
                <MaterialIcon
                  name="videogame_asset"
                  :class="`text-[${game.color}]`"
                />
              </div>
            </div>

            <p class="mb-4 text-sm text-on-surface-variant">
              {{ game.description }}
            </p>

            <div class="flex items-center gap-2 text-primary">
              <span class="font-label-sm text-label-sm uppercase">Jugar ahora</span>
              <MaterialIcon
                name="arrow_forward"
                class="transition-transform group-hover:translate-x-1"
              />
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Leaderboard Section -->
      <div class="mt-12 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6">
        <h2 class="mb-4 flex items-center gap-3 font-headline-lg text-2xl text-on-surface">
          <MaterialIcon
            name="emoji_events"
            class="text-primary"
          />
          Tabla de Clasificación
        </h2>
        <p class="text-on-surface-variant">
          Las puntuaciones más altas aparecerán aquí próximamente.
        </p>
      </div>
    </div>
  </div>
</template>
