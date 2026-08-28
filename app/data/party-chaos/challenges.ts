import type { Challenge, ChallengeCategory } from '~/types/party-chaos'

let challengeCounter = 0

function c(category: ChallengeCategory, text: string, seconds = 15): Challenge {
  challengeCounter += 1
  return { id: `ch-${challengeCounter}`, category, text, seconds }
}

export const CHALLENGES: Challenge[] = [
  // 😂 Graciosos
  c('funny', 'Haz que alguien del grupo se ría sin hablar.', 30),
  c('funny', 'Imita a alguien del grupo (sin decir quién es).', 20),
  c('funny', 'Mantén una cara seria mientras los demás intentan hacerte reír.', 30),
  c('funny', 'Habla como robot durante 20 segundos.', 20),
  c('funny', 'Cuenta el chiste más malo que conozcas.', 15),
  c('funny', 'Baila sin música durante 15 segundos.', 15),
  c('funny', 'Haz 3 sonidos de animales distintos seguidos.', 10),
  c('funny', 'Haz la cara más tonta posible durante 10 segundos.', 10),
  c('funny', 'Cuenta un chiste usando solo gestos.', 25),
  c('funny', 'Imita el sonido de una moto arrancando.', 12),
  c('funny', 'Di "Pink & Black" con la voz más dramática posible.', 8),
  c('funny', 'Haz reír a alguien solo moviendo las cejas.', 20),
  c('funny', 'Inventa un apodo ridículo para cada jugador en 20 segundos.', 20),

  // 🧠 Mentales
  c('mental', 'Di los meses del año al revés.', 20),
  c('mental', 'Di 5 capitales de países en 10 segundos.', 10),
  c('mental', 'Resuelve en voz alta: 17 × 3 + 8.', 15),
  c('mental', 'Di el abecedario saltándote la letra M.', 25),
  c('mental', 'Nombra 6 cosas que sean redondas en 8 segundos.', 8),
  c('mental', 'Di 4 palabras que rimen con "casa".', 12),
  c('mental', 'Di 5 palabras que empiecen con la misma letra que tu nombre.', 10),
  c('mental', 'Cuenta de 7 en 7 hasta pasar 50.', 15),
  c('mental', 'Di 3 sinónimos de "rápido" sin repetir.', 10),
  c('mental', 'Nombra 5 cosas que encontrarías en una cocina.', 8),
  c('mental', 'Di el resultado de 12 + 19 + 8 sin usar las manos.', 8),
  c('mental', 'Di 4 países de América del Sur en 6 segundos.', 6),

  // 🎭 Actuación
  c('acting', 'Haz una imitación de un perro durante 15 segundos.', 15),
  c('acting', 'Actúa como si estuvieras en una película de terror.', 20),
  c('acting', 'Imita a un presentador de noticias anunciando el apocalipsis.', 20),
  c('acting', 'Haz de chef explicando una receta absurda.', 20),
  c('acting', 'Actúa como si fueras un extraterrestre visitando la Tierra.', 20),
  c('acting', 'Imita a un conductor de autobús anunciando paradas inventadas.', 20),
  c('acting', 'Haz de vendedor telefónico vendiendo aire enlatado.', 20),
  c('acting', 'Actúa como si acabaras de ganar la lotería.', 15),
  c('acting', 'Imita a un comentarista deportivo narrando algo mundano.', 20),
  c('acting', 'Haz de profesor explicando por qué el cielo es verde.', 20),
  c('acting', 'Actúa como zombie pidiendo permiso para pasar.', 15),

  // ⚡ Velocidad
  c('speed', 'Di 5 frutas en 3 segundos.', 3),
  c('speed', 'Di 7 colores en 5 segundos.', 5),
  c('speed', 'Di 6 animales sin repetir ninguno en 5 segundos.', 5),
  c('speed', 'Toca tu nariz, oreja izquierda y rodilla derecha en ese orden.', 5),
  c('speed', 'Di el nombre de todos los jugadores en orden en 4 segundos.', 4),
  c('speed', 'Di 8 verduras en 5 segundos.', 5),
  c('speed', 'Di 5 marcas de motos en 4 segundos.', 4),
  c('speed', 'Di los días de la semana al revés en 6 segundos.', 6),
  c('speed', 'Chasquea los dedos 10 veces lo más rápido posible.', 5),
  c('speed', 'Di 6 partes del cuerpo tocándolas al mismo tiempo.', 6),

  // 👀 Memoria
  c('memory', 'Memoriza y repite: 🔴 🟢 🔵 🟡 🟣', 10),
  c('memory', 'Mira al grupo 5 segundos y di quién lleva algo de color azul.', 8),
  c('memory', 'Memoriza y repite: 🍎 🍌 🚗 🐶 🎸 🏠', 10),
  c('memory', 'Cierra los ojos y di cuántas personas hay en la sala.', 5),
  c('memory', 'Mira al grupo y di el color de zapatos de 3 personas.', 10),

  // 🤪 Absurdos
  c('absurd', 'Convence al grupo de que el pan es un invento reciente.', 20),
  c('absurd', 'Habla solo con preguntas durante 20 segundos.', 20),
  c('absurd', 'Inventa un baile llamado "El Pink & Black" y enséñalo.', 25),
  c('absurd', 'Vende un producto inventado al grupo en 15 segundos.', 15),
  c('absurd', 'Explica por qué las sillas deberían ser ilegales.', 20),
  c('absurd', 'Habla como si fueras el presidente de los gatos.', 20),
  c('absurd', 'Inventa una religión que adore los semáforos.', 25),
  c('absurd', 'Convence al grupo de mudarse a vivir bajo el agua.', 20),

  // 🎯 Precisión
  c('precision', 'Lanza algo al aire y atrápalo 3 veces seguidas.', 15),
  c('precision', 'Apunta con el dedo a la nariz de 3 personas distintas sin fallar.', 12),
  c('precision', 'Equilibra el celular en la palma de la mano 10 segundos.', 10),
  c('precision', 'Tira una moneda y que caiga en la palma 2 veces seguidas.', 15),
  c('precision', 'Camina en línea recta con los ojos cerrados 5 pasos.', 12),
  c('precision', 'Apunta al objeto más lejano de la sala sin equivocarte.', 8),

  // 👥 Grupo
  c('group', 'Organiza al grupo en orden alfabético por nombre en 15 segundos.', 15),
  c('group', 'Haz que todos digan "Pink & Black" al unísono en 3 intentos.', 20),
  c('group', 'Elige a alguien y dile 3 cumplidos sinceros en 10 segundos.', 10),
  c('group', 'Formen una torre humana (mínimo 2 niveles) en 15 segundos.', 15),
  c('group', 'Todos deben chocar los cinco al mismo tiempo en 3 intentos.', 15),
  c('group', 'Elige un líder y haz que todos lo sigan en una acción durante 10 segundos.', 10),

  // 😈 Traición (retos sociales)
  c('betrayal', 'Sin que nadie se dé cuenta, haz que alguien diga "sí" tres veces.', 30),
  c('betrayal', 'Consigue que alguien te preste algo sin pedírselo directamente.', 25),
  c('betrayal', 'Haz que alguien cambie de sitio sin decirle que se mueva.', 20),
  c('betrayal', 'Logra que alguien repita una palabra que tú digas.', 25),
]

export const FORBIDDEN_WORDS = [
  'azul',
  'pizza',
  'motocicleta',
  'lluvia',
  'café',
  'viernes',
  'hermano',
  'playa',
  'dinero',
  'trabajo',
  'fútbol',
  'amor',
  'hambre',
  'mañana',
]

export const CHARACTER_ROLES = [
  { emoji: '🐔', name: 'Gallina' },
  { emoji: '🤖', name: 'Robot' },
  { emoji: '👴', name: 'Abuelo' },
  { emoji: '👶', name: 'Bebé' },
  { emoji: '🧛', name: 'Vampiro' },
  { emoji: '🤠', name: 'Vaquero' },
  { emoji: '👽', name: 'Alien' },
  { emoji: '🧙', name: 'Mago' },
  { emoji: '🤡', name: 'Payaso' },
  { emoji: '🦸', name: 'Superhéroe' },
]

export const BETRAYAL_MISSIONS = [
  (target: string, word: string) =>
    `Haz que ${target} diga la palabra "${word}" sin que se dé cuenta.`,
  (target: string) => `Haz que ${target} te toque el hombro.`,
  (target: string) => `Consigue que ${target} diga "no sé".`,
  (target: string) => `Haz que ${target} imite a un animal.`,
  (target: string) => `Haz que ${target} te mire fijamente 3 segundos.`,
  (target: string, word: string) =>
    `Haz que ${target} mencione algo relacionado con "${word}".`,
]

export const LIE_PROMPTS = [
  'Di 3 cosas que hiciste ayer. Una debe ser mentira.',
  'Di 3 comidas que odias. Una debe ser mentira.',
  'Di 3 lugares donde has viajado. Uno debe ser mentira.',
  'Di 3 talentos que tienes. Uno debe ser mentira.',
  'Di 3 miedos que tienes. Uno debe ser mentira.',
  'Di 3 cosas que tienes en tu mochila o bolsillo. Una debe ser mentira.',
  'Di 3 famosos que conocerías. Uno debe ser mentira.',
  'Di 3 cosas que nunca harías. Una debe ser mentira (¡mentira!).',
]

export const CEREBRO_CHALLENGES = [
  'Di 7 animales sin repetir ninguno en 5 segundos.',
  'Di 5 países en 4 segundos.',
  'Di 6 objetos de color rojo en 5 segundos.',
  'Di el alfabeto sin la letra A en 15 segundos.',
  'Di 5 cosas que caben en un bolsillo en 4 segundos.',
]

export function pickChallenge(categories: ChallengeCategory[], used: string[] = []): Challenge {
  const pool = CHALLENGES.filter(
    (ch) => categories.includes(ch.category) && !used.includes(ch.id),
  )
  const fallback = CHALLENGES.filter((ch) => categories.includes(ch.category))
  const source = pool.length > 0 ? pool : fallback
  return source[Math.floor(Math.random() * source.length)]!
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}
