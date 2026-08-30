<script setup lang="ts">
import { getGameById } from '~/data/games'
import type { MobileControlLayout } from '~/components/games/GameMobileControls.vue'
import type { LocalGameId } from '~/types/party-chaos'
import type { PartyGameId } from '#shared/types/party-games'

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

const route = useRoute()
const gameId = route.params.id as string
const game = getGameById(gameId)

if (!game) {
  throw createError({ statusCode: 404, message: 'Juego no encontrado' })
}

const isMultiplayer = game.mode === 'multiplayer'
const isLocal = game.mode === 'local'
const partyGameType = gameId as PartyGameId

const playersLabel = computed(() =>
  game.minPlayers === game.maxPlayers
    ? `${game.maxPlayers} jugadores`
    : `${game.minPlayers}-${game.maxPlayers} jugadores`,
)

useSeoMeta({
  title: `${game.title} | Pink & Black`,
})

const { startGame: startPartyGame, resetSession } = usePartyChaos()
const localPhase = ref<'setup' | 'playing'>('setup')

function onRoomCreated(code: string) {
  navigateTo(`/games/${gameId}/room/${code}`)
}

function onLocalStart() {
  if (startPartyGame(gameId as LocalGameId)) {
    localPhase.value = 'playing'
  }
}

function onLocalFinish() {
  localPhase.value = 'setup'
  resetSession()
}

const state = ref<'idle' | 'playing' | 'paused' | 'gameover'>('idle')
const score = ref(0)
const lives = ref(3)
const level = ref(1)

const handleScoreChange = (newScore: number) => {
  score.value = newScore
}

const handleLivesChange = (newLives: number) => {
  lives.value = newLives
  if (newLives === 0) {
    state.value = 'gameover'
  }
}

const handleLevelChange = (newLevel: number) => {
  level.value = newLevel
}

const handleGameOver = (finalScore: number) => {
  score.value = finalScore
  state.value = 'gameover'
}

const startGame = () => {
  state.value = 'playing'
  score.value = 0
  lives.value = 3
  level.value = 1
}

const togglePause = () => {
  if (state.value === 'playing') {
    state.value = 'paused'
  } else if (state.value === 'paused') {
    state.value = 'playing'
  }
}

const restartGame = () => {
  startGame()
}

const goBack = () => {
  navigateTo('/games')
}

const MOBILE_LAYOUTS: Record<string, MobileControlLayout> = {
  snake: 'dpad',
  frogger: 'dpad',
  tetris: 'tetris',
  asteroids: 'asteroids',
  arkanoid: 'paddle',
}

const mobileLayout = computed(() => MOBILE_LAYOUTS[gameId] ?? 'dpad')
const showMobileControls = computed(
  () => (state.value === 'playing' || state.value === 'paused') && MOBILE_LAYOUTS[gameId],
)
</script>

<template>
  <div class="flex w-full flex-col">
    <div class="h-1 w-full overflow-hidden bg-surface-container-highest">
      <div
        class="h-full w-1/3 bg-primary shadow-[0_0_10px_rgba(255,176,202,1)]"
      />
    </div>

    <div class="p-gutter-mobile md:p-gutter-desktop">
      <!-- Multiplayer party games -->
      <template v-if="isMultiplayer">
        <div class="mb-6 flex items-center gap-4">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-colors hover:bg-surface-container-high"
            @click="goBack"
          >
            <MaterialIcon name="arrow_back" />
          </button>
          <div>
            <h1 class="font-headline-lg text-2xl text-on-surface md:text-3xl">
              {{ game.emoji }} {{ game.title }}
            </h1>
            <p class="font-label-sm text-label-sm uppercase text-primary">
              {{ game.category }} · Multijugador
            </p>
          </div>
        </div>

        <div class="mx-auto max-w-xl space-y-6">
          <PartyGameGuide
            v-if="game.guide"
            :guide="game.guide"
            :emoji="game.emoji"
            :title="game.title"
          />
          <PartyLobbyCard
            :game="game"
            @created="onRoomCreated"
          />
          <PartyRoomsBrowser
            :game-type="partyGameType"
            :title="`Salas de ${game.title}`"
          />
        </div>
      </template>

      <!-- Local pass-the-phone games -->
      <template v-else-if="isLocal">
        <div class="mb-6 flex items-center gap-4">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-colors hover:bg-surface-container-high"
            @click="goBack"
          >
            <MaterialIcon name="arrow_back" />
          </button>
          <div>
            <h1 class="font-headline-lg text-2xl text-on-surface md:text-3xl">
              {{ game.emoji }} {{ game.title }}
            </h1>
            <p class="font-label-sm text-label-sm uppercase text-primary">
              Pasa el celular · {{ playersLabel }}
            </p>
          </div>
        </div>

        <!-- Real-time local game: no player roster needed -->
        <div
          v-if="gameId === 'hockey-aire'"
          class="mx-auto max-w-xl space-y-6"
        >
          <PartyGameGuide
            v-if="game.guide"
            :guide="game.guide"
            :emoji="game.emoji"
            :title="game.title"
          />
          <AirHockeyGame @finish="goBack" />
        </div>

        <template v-else>
          <PartyChaosSetup
            v-if="localPhase === 'setup'"
            :game="game"
            :show-config="gameId === 'party-chaos'"
            @start="onLocalStart"
          />

          <RetoOPierdesGame
            v-else-if="gameId === 'reto-o-pierdes'"
            @finish="onLocalFinish"
          />
          <NoTeRiasGame
            v-else-if="gameId === 'no-te-rias'"
            @finish="onLocalFinish"
          />
          <CerebroGrupoGame
            v-else-if="gameId === 'cerebro-grupo'"
            @finish="onLocalFinish"
          />
          <PartyChaosMixed
            v-else-if="gameId === 'party-chaos'"
            @finish="onLocalFinish"
          />
        </template>
      </template>

      <!-- Solo arcade games -->
      <template v-else>
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-colors hover:bg-surface-container-high"
            @click="goBack"
          >
            <MaterialIcon name="arrow_back" />
          </button>
          <div>
            <h1 class="font-headline-lg text-2xl text-on-surface md:text-3xl">
              {{ game.title }}
            </h1>
            <p class="font-label-sm text-label-sm uppercase text-primary">
              {{ game.category }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-6 lg:flex-row">
        <!-- Game Area -->
        <div class="flex-1">
          <div class="relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low/30">
            <!-- Game Canvas Container -->
            <div class="relative aspect-square w-full touch-none bg-black">
              <SnakeGame
                v-if="gameId === 'snake' && state !== 'idle'"
                :paused="state === 'paused'"
                :on-score-change="handleScoreChange"
                :on-lives-change="handleLivesChange"
                :on-level-change="handleLevelChange"
                :on-game-over="handleGameOver"
              />
              <TetrisGame
                v-else-if="gameId === 'tetris' && state !== 'idle'"
                :paused="state === 'paused'"
                :on-score-change="handleScoreChange"
                :on-lives-change="handleLivesChange"
                :on-level-change="handleLevelChange"
                :on-game-over="handleGameOver"
              />
              <AsteroidsGame
                v-else-if="gameId === 'asteroids' && state !== 'idle'"
                :paused="state === 'paused'"
                :on-score-change="handleScoreChange"
                :on-lives-change="handleLivesChange"
                :on-level-change="handleLevelChange"
                :on-game-over="handleGameOver"
              />
              <ArkanoidGame
                v-else-if="gameId === 'arkanoid' && state !== 'idle'"
                :paused="state === 'paused'"
                :on-score-change="handleScoreChange"
                :on-lives-change="handleLivesChange"
                :on-level-change="handleLevelChange"
                :on-game-over="handleGameOver"
              />
              <FroggerGame
                v-else-if="gameId === 'frogger' && state !== 'idle'"
                :paused="state === 'paused'"
                :on-score-change="handleScoreChange"
                :on-lives-change="handleLivesChange"
                :on-level-change="handleLevelChange"
                :on-game-over="handleGameOver"
              />

              <!-- Start Overlay -->
              <div
                v-if="state === 'idle'"
                class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
              >
                <MaterialIcon
                  name="videogame_asset"
                  class="mb-4 text-6xl text-primary"
                />
                <h2 class="mb-2 font-headline-lg text-2xl text-on-surface">
                  {{ game.title }}
                </h2>
                <p class="mb-6 text-on-surface-variant">
                  {{ game.description }}
                </p>
                <button
                  type="button"
                  class="rounded-lg bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)]"
                  @click="startGame"
                >
                  Comenzar Juego
                </button>
              </div>

              <!-- Pause Overlay -->
              <div
                v-if="state === 'paused'"
                class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
              >
                <MaterialIcon
                  name="pause"
                  class="mb-4 text-6xl text-primary"
                />
                <h2 class="mb-6 font-headline-lg text-2xl text-on-surface">
                  PAUSA
                </h2>
                <button
                  type="button"
                  class="rounded-lg bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)]"
                  @click="togglePause"
                >
                  Continuar
                </button>
              </div>

              <!-- Game Over Overlay -->
              <div
                v-if="state === 'gameover'"
                class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
              >
                <MaterialIcon
                  name="sports_score"
                  class="mb-4 text-6xl text-error"
                />
                <h2 class="mb-2 font-headline-lg text-2xl text-on-surface">
                  GAME OVER
                </h2>
                <p class="mb-6 text-4xl font-bold text-primary">
                  {{ score }}
                </p>
                <div class="flex gap-4">
                  <button
                    type="button"
                    class="rounded-lg border border-primary px-6 py-3 font-label-sm text-label-sm uppercase tracking-wider text-primary transition-all hover:bg-primary/10"
                    @click="goBack"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    class="rounded-lg bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)]"
                    @click="restartGame"
                  >
                    Jugar de Nuevo
                  </button>
                </div>
              </div>

            </div>
          </div>

          <GameMobileControls
            v-if="showMobileControls"
            :layout="mobileLayout"
            class="mt-4 lg:hidden"
          />
        </div>

        <!-- Sidebar -->
        <aside class="w-full lg:w-80">
          <div class="space-y-6">
            <!-- Stats Card -->
            <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6">
              <h3 class="mb-4 font-headline-lg text-xl text-on-surface">
                Estadísticas
              </h3>
              <div class="space-y-4">
                <div>
                  <div class="mb-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Puntuación
                  </div>
                  <div class="font-headline-lg text-3xl text-primary">
                    {{ score }}
                  </div>
                </div>
                <div>
                  <div class="mb-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Vidas
                  </div>
                  <div class="flex gap-2">
                    <MaterialIcon
                      v-for="i in 3"
                      :key="i"
                      name="favorite"
                      :class="i <= lives ? 'text-error' : 'text-outline-variant'"
                    />
                  </div>
                </div>
                <div>
                  <div class="mb-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Nivel
                  </div>
                  <div class="font-headline-lg text-2xl text-on-surface">
                    {{ level }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Controls Card -->
            <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6">
              <h3 class="mb-4 font-headline-lg text-xl text-on-surface">
                Controles
              </h3>
              <div class="space-y-3">
                <button
                  v-if="state === 'playing'"
                  type="button"
                  class="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 py-3 transition-colors hover:bg-surface-container-highest"
                  @click="togglePause"
                >
                  <MaterialIcon name="pause" />
                  <span class="font-label-sm text-label-sm uppercase">Pausar</span>
                </button>
                <button
                  v-if="state === 'playing' || state === 'paused' || state === 'gameover'"
                  type="button"
                  class="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 py-3 transition-colors hover:bg-surface-container-highest"
                  @click="restartGame"
                >
                  <MaterialIcon name="restart_alt" />
                  <span class="font-label-sm text-label-sm uppercase">Reiniciar</span>
                </button>
              </div>

              <div class="mt-6 space-y-2 border-t border-outline-variant/20 pt-4">
                <p class="font-label-sm text-label-sm uppercase text-on-surface-variant lg:hidden">
                  En celular
                </p>
                <p class="hidden font-label-sm text-label-sm uppercase text-on-surface-variant lg:block">
                  Teclas
                </p>
                <div class="space-y-1 text-sm text-on-surface-variant lg:hidden">
                  <p v-if="mobileLayout === 'dpad'">
                    Usa el pad direccional debajo del juego.
                  </p>
                  <p v-else-if="mobileLayout === 'tetris'">
                    Mueve, rota y baja piezas con los botones táctiles.
                  </p>
                  <p v-else-if="mobileLayout === 'asteroids'">
                    Gira, acelera y dispara con los botones táctiles.
                  </p>
                  <p v-else-if="mobileLayout === 'paddle'">
                    Arrastra sobre el juego o usa los botones ← →.
                  </p>
                </div>
                <div class="hidden space-y-1 text-sm text-on-surface-variant lg:block">
                  <p>↑ / W - Arriba</p>
                  <p>↓ / S - Abajo</p>
                  <p>← / A - Izquierda</p>
                  <p>→ / D - Derecha</p>
                  <p v-if="gameId === 'tetris'">
                    Espacio - Caída rápida
                  </p>
                  <p v-if="gameId === 'asteroids'">
                    Espacio - Disparar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
      </template>
    </div>
  </div>
</template>
