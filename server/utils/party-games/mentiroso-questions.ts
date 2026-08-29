export interface MentirosoQuestion {
  id: string
  prompt: string
  answer: string
}

/**
 * Fill-in-the-blank trivia. Real answers are picked to be weird/surprising on
 * purpose — that's what makes a fake answer plausible and the reveal funny.
 */
export const MENTIROSO_QUESTIONS: MentirosoQuestion[] = [
  { id: 'q1', prompt: 'La sangre del pulpo es de color _____.', answer: 'AZUL' },
  { id: 'q2', prompt: 'El animal terrestre más rápido del mundo es el _____.', answer: 'GUEPARDO' },
  { id: 'q3', prompt: 'La capital de Australia no es Sídney, es _____.', answer: 'CANBERRA' },
  { id: 'q4', prompt: 'La miel nunca se _____, puede durar miles de años.', answer: 'ECHA A PERDER' },
  { id: 'q5', prompt: 'Los pingüinos emperador aguantan la respiración bajo el agua hasta _____ minutos.', answer: '20' },
  { id: 'q6', prompt: 'El primer video subido a YouTube se llamaba "Yo en el _____".', answer: 'ZOOLÓGICO' },
  { id: 'q7', prompt: 'Un día en Venus dura más tiempo que su propio _____.', answer: 'AÑO' },
  { id: 'q8', prompt: 'La Torre Eiffel puede crecer hasta _____ cm más en verano por el calor.', answer: '15' },
  { id: 'q9', prompt: 'Botánicamente, las bananas son técnicamente _____, no una fruta simple.', answer: 'BAYAS' },
  { id: 'q10', prompt: 'Botánicamente, las fresas NO son técnicamente _____.', answer: 'BAYAS' },
  { id: 'q11', prompt: 'El animal con más dientes del mundo es el _____.', answer: 'CARACOL' },
  { id: 'q12', prompt: 'El excremento de los wombats tiene forma _____.', answer: 'CÚBICA' },
  { id: 'q13', prompt: 'En inglés, a un grupo de cuervos se le llama "a _____ of crows".', answer: 'MURDER' },
  { id: 'q14', prompt: 'Nintendo fue fundada en 1889 y originalmente vendía _____.', answer: 'CARTAS' },
  { id: 'q15', prompt: 'Los koalas tienen huellas dactilares casi idénticas a las de los _____.', answer: 'HUMANOS' },
  { id: 'q16', prompt: 'La primera película de la historia duró solo _____ segundos.', answer: '2' },
  { id: 'q17', prompt: 'Los pulpos tienen _____ corazones.', answer: 'TRES' },
  { id: 'q18', prompt: 'Un rayo puede ser hasta _____ veces más caliente que la superficie del sol.', answer: '5' },
  { id: 'q19', prompt: 'El animal que más horas duerme al día es el _____.', answer: 'KOALA' },
  { id: 'q20', prompt: 'La palabra "OK" viene de una broma escrita a propósito mal: "oll _____" (todo correcto).', answer: 'KORRECT' },
  { id: 'q21', prompt: 'Los caballitos de mar son los únicos animales donde el que queda embarazado es el _____.', answer: 'MACHO' },
  { id: 'q22', prompt: 'Islandia es famosa por no tener ni un solo _____ nativo en toda la isla.', answer: 'MOSQUITO' },
  { id: 'q23', prompt: 'Groenlandia, a pesar de su nombre, le pertenece a _____.', answer: 'DINAMARCA' },
  { id: 'q24', prompt: 'Un estornudo humano puede alcanzar hasta _____ km/h.', answer: '160' },
  { id: 'q25', prompt: 'La primera motocicleta de la historia se construyó en el año _____.', answer: '1885' },
  { id: 'q26', prompt: 'Las autopistas de _____ son famosas por no tener límite de velocidad general.', answer: 'ALEMANIA' },
  { id: 'q27', prompt: 'Las jirafas duermen en promedio menos de _____ horas al día.', answer: '2' },
  { id: 'q28', prompt: 'Un grupo de flamencos rosados obtiene su color por comer _____.', answer: 'CAMARONES' },
  { id: 'q29', prompt: 'El país con más pirámides del mundo no es Egipto, es _____.', answer: 'SUDÁN' },
  { id: 'q30', prompt: 'El chicle tarda aproximadamente _____ años en biodegradarse por completo.', answer: '5' },
  { id: 'q31', prompt: 'Las nutrias marinas duermen tomadas de la _____ para no separarse a la deriva.', answer: 'MANO' },
  { id: 'q32', prompt: 'El órgano más grande del cuerpo humano es la _____.', answer: 'PIEL' },
  { id: 'q33', prompt: 'Los tiburones existen desde antes que los _____.', answer: 'ÁRBOLES' },
  { id: 'q34', prompt: 'Una nube típica de tormenta puede pesar más de _____ toneladas.', answer: '1 MILLÓN' },
  { id: 'q35', prompt: 'El país que consume más pizza per cápita del mundo NO es Italia, es _____.', answer: 'ESTADOS UNIDOS' },
  { id: 'q36', prompt: 'Los elefantes son de los pocos animales que no pueden _____.', answer: 'SALTAR' },
  { id: 'q37', prompt: 'La Coca-Cola fue inventada originalmente como un remedio para el _____.', answer: 'DOLOR DE CABEZA' },
  { id: 'q38', prompt: 'El emoji más usado del mundo es el de _____.', answer: 'LÁGRIMAS DE RISA' },
  { id: 'q39', prompt: 'Las abejas pueden reconocer rostros _____ individuales.', answer: 'HUMANOS' },
  { id: 'q40', prompt: 'En un día despejado, se puede ver la Gran Muralla China desde _____ (mito muy común, en realidad es falso).', answer: 'EL ESPACIO' },
]

export function pickRandomMentirosoQuestion(used: string[] = []): MentirosoQuestion {
  const available = MENTIROSO_QUESTIONS.filter((q) => !used.includes(q.id))
  const pool = available.length > 0 ? available : MENTIROSO_QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]!
}
