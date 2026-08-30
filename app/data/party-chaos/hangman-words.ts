export type HangmanCategory =
  | 'animales'
  | 'motos'
  | 'comida'
  | 'peliculas'
  | 'deportes'
  | 'club'

export const HANGMAN_CATEGORY_META: Record<
  HangmanCategory,
  { label: string; emoji: string }
> = {
  animales: { label: 'Animales', emoji: '🦁' },
  motos: { label: 'Motos y marcas', emoji: '🏍️' },
  comida: { label: 'Comida', emoji: '🍕' },
  peliculas: { label: 'Películas', emoji: '🎬' },
  deportes: { label: 'Deportes', emoji: '⚽' },
  club: { label: 'Club y rodadas', emoji: '🏍️' },
}

export interface HangmanEntry {
  id: string
  word: string
  hint: string
  category: HangmanCategory
}

const ENTRIES: HangmanEntry[] = [
  { id: 'a1', word: 'LEON', hint: 'Rey de la selva', category: 'animales' },
  { id: 'a2', word: 'DELFÍN', hint: 'Mamífero marino muy inteligente', category: 'animales' },
  { id: 'a3', word: 'PINGÜINO', hint: 'Ave que no vuela y vive en el hielo', category: 'animales' },
  { id: 'a4', word: 'JIRAFA', hint: 'El cuello más largo del reino animal', category: 'animales' },
  { id: 'a5', word: 'TIBURON', hint: 'Depredador con muchos dientes', category: 'animales' },
  { id: 'a6', word: 'KOALA', hint: 'Duerme en eucaliptos en Australia', category: 'animales' },
  { id: 'a7', word: 'PANDA', hint: 'Oso blanco y negro que come bambú', category: 'animales' },
  { id: 'a8', word: 'ELEFANTE', hint: 'El animal terrestre más grande', category: 'animales' },

  { id: 'm1', word: 'HARLEY', hint: 'Marca americana con motor V-Twin', category: 'motos' },
  { id: 'm2', word: 'DUCATI', hint: 'Fabricante italiano de deportivas', category: 'motos' },
  { id: 'm3', word: 'KAWASAKI', hint: 'Marca japonesa, verde característico', category: 'motos' },
  { id: 'm4', word: 'YAMAHA', hint: 'También hace pianos y motos', category: 'motos' },
  { id: 'm5', word: 'HONDA', hint: 'CB, CBR y muchas más', category: 'motos' },
  { id: 'm6', word: 'BMW', hint: 'Boxer alemán con logo azul y blanco', category: 'motos' },
  { id: 'm7', word: 'TRIUMPH', hint: 'Clásica británica', category: 'motos' },
  { id: 'm8', word: 'KTM', hint: 'Naranja austriaca, off-road', category: 'motos' },

  { id: 'c1', word: 'TACOS', hint: 'Tortilla con relleno mexicano', category: 'comida' },
  { id: 'c2', word: 'PIZZA', hint: 'Masa, queso y horno', category: 'comida' },
  { id: 'c3', word: 'HAMBURGUESA', hint: 'Pan, carne y extras', category: 'comida' },
  { id: 'c4', word: 'CHOCOLATE', hint: 'Dulce de cacao', category: 'comida' },
  { id: 'c5', word: 'EMPANADA', hint: 'Masa rellena al horno o frita', category: 'comida' },
  { id: 'c6', word: 'AREPA', hint: 'Pan de maíz venezolano', category: 'comida' },
  { id: 'c7', word: 'SUSHI', hint: 'Arroz con pescado crudo', category: 'comida' },
  { id: 'c8', word: 'HELADO', hint: 'Postre frío de leche', category: 'comida' },

  { id: 'p1', word: 'TITANIC', hint: 'Barco que chocó con un iceberg', category: 'peliculas' },
  { id: 'p2', word: 'AVATAR', hint: 'Pandora y los Na\'vi', category: 'peliculas' },
  { id: 'p3', word: 'SHREK', hint: 'Ogro verde con burro', category: 'peliculas' },
  { id: 'p4', word: 'MATRIX', hint: 'Pastilla roja o azul', category: 'peliculas' },
  { id: 'p5', word: 'GLADIADOR', hint: 'Roma y el Coliseo', category: 'peliculas' },
  { id: 'p6', word: 'ROCKY', hint: 'Boxeador de Filadelfia', category: 'peliculas' },
  { id: 'p7', word: 'JOKER', hint: 'Villano de Gotham', category: 'peliculas' },
  { id: 'p8', word: 'FROZEN', hint: 'Déjalo ir, déjalo ir', category: 'peliculas' },

  { id: 'd1', word: 'FUTBOL', hint: 'Gol con los pies', category: 'deportes' },
  { id: 'd2', word: 'BASQUETBOL', hint: 'Canasta a diez pies', category: 'deportes' },
  { id: 'd3', word: 'TENIS', hint: 'Raqueta y red', category: 'deportes' },
  { id: 'd4', word: 'BOXEO', hint: 'Guantes en un ring', category: 'deportes' },
  { id: 'd5', word: 'NATACION', hint: 'Deporte en la piscina', category: 'deportes' },
  { id: 'd6', word: 'VOLEIBOL', hint: 'Se juega sobre una red', category: 'deportes' },
  { id: 'd7', word: 'GOLF', hint: 'Hoyo en uno', category: 'deportes' },
  { id: 'd8', word: 'RUGBY', hint: 'Balón ovalado y placajes', category: 'deportes' },

  { id: 'b1', word: 'RODADA', hint: 'Salida en grupo con motos', category: 'club' },
  { id: 'b2', word: 'CASCO', hint: 'Protección obligatoria en la cabeza', category: 'club' },
  { id: 'b3', word: 'CARBURADOR', hint: 'Mezcla aire y gasolina (clásicas)', category: 'club' },
  { id: 'b4', word: 'HERMANDAD', hint: 'Lo que une al club', category: 'club' },
  { id: 'b5', word: 'CARRETERA', hint: 'Donde se siente el viento', category: 'club' },
  { id: 'b6', word: 'CURVA', hint: 'Inclinarse es la clave', category: 'club' },
  { id: 'b7', word: 'MOTOCICLISTA', hint: 'Quien monta la máquina', category: 'club' },
  { id: 'b8', word: 'COMBUSTIBLE', hint: 'Sin esto no hay viaje', category: 'club' },
]

function normalizeLetter(char: string) {
  return char
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function normalizeWord(word: string) {
  return word
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function pickHangmanEntry(
  categories: HangmanCategory[],
  usedIds: string[],
): HangmanEntry {
  const pool = ENTRIES.filter(
    (entry) => categories.includes(entry.category) && !usedIds.includes(entry.id),
  )

  if (pool.length === 0) {
    const fallback = ENTRIES.filter((entry) => categories.includes(entry.category))
    return fallback[Math.floor(Math.random() * fallback.length)]!
  }

  return pool[Math.floor(Math.random() * pool.length)]!
}

export const HANGMAN_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
] as const

export function letterInWord(word: string, letter: string) {
  const target = normalizeLetter(letter)
  return normalizeWord(word).includes(target)
}

export function isWordComplete(word: string, guessed: Set<string>) {
  for (const char of normalizeWord(word)) {
    if (char === ' ') continue
    if (!guessed.has(char)) return false
  }
  return true
}

export const MAX_HANGMAN_MISTAKES = 6
