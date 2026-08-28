export const INFILTRADO_WORDS = [
  'PLAYA',
  'MONTAÑA',
  'PIZZA',
  'CINE',
  'MÚSICA',
  'FÚTBOL',
  'BIBLIOTECA',
  'HOSPITAL',
  'AEROPUERTO',
  'RESTAURANTE',
  'UNIVERSIDAD',
  'PARQUE',
  'MUSEO',
  'GIMNASIO',
  'SUPERMERCADO',
  'CAMPING',
  'DISCOTECA',
  'FARMACIA',
  'TEATRO',
  'ZOO',
  'HELADO',
  'MOTO',
  'CARRETERA',
  'LLUVIA',
  'DESAYUNO',
  'VACACIONES',
  'CUMPLEAÑOS',
  'BODA',
  'NAVIDAD',
  'HALLOWEEN',
] as const

export function pickRandomWord(used: string[] = []): string {
  const available = INFILTRADO_WORDS.filter((word) => !used.includes(word))
  const pool = available.length > 0 ? available : [...INFILTRADO_WORDS]
  return pool[Math.floor(Math.random() * pool.length)]!
}
