import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido').transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export const createInviteSchema = z.object({
  email: z
    .union([
      z.literal(''),
      z.string().email('Email inválido').transform((value) => value.toLowerCase().trim()),
    ])
    .optional()
    .transform((value) => (value ? value : undefined)),
  role: z.enum(['admin', 'user']).default('user'),
})

export const acceptInviteSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  email: z.string().email('Email inválido').transform((value) => value.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
  motorcycle: z
    .union([z.literal(''), z.string().trim().max(120)])
    .optional()
    .transform((value) => (value ? value : undefined)),
})

export const externalVideoUrlSchema = z
  .string()
  .trim()
  .url('URL inválida')
  .min(10)
  .refine(
    (value) => {
      const lower = value.toLowerCase()
      return (
        lower.includes('youtube.com')
        || lower.includes('youtu.be')
        || lower.includes('tiktok.com')
        || lower.includes('vm.tiktok.com')
      )
    },
    { message: 'Solo se aceptan enlaces de YouTube o TikTok' },
  )

export const createYoutubeMediaSchema = z
  .object({
    title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres').max(160),
    videoUrl: externalVideoUrlSchema.optional(),
    youtubeUrl: externalVideoUrlSchema.optional(),
  })
  .refine((value) => Boolean(value.videoUrl || value.youtubeUrl), {
    message: 'La URL del video es requerida',
    path: ['videoUrl'],
  })
  .transform((value) => ({
    title: value.title,
    videoUrl: (value.videoUrl ?? value.youtubeUrl)!,
  }))

export const updateMediaSchema = z.object({
  title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres').max(160),
})

export const createEventSchema = z.object({
  title: z.string().trim().min(3, 'El nombre de la rodada es muy corto').max(160),
  description: z
    .union([z.literal(''), z.string().trim().max(2000)])
    .optional()
    .transform((value) => (value ? value : undefined)),
  startsAt: z.string().min(1, 'La fecha es requerida'),
  location: z.string().trim().min(2, 'La ubicación es requerida').max(200),
  difficulty: z.enum(['beginner', 'pro', 'hardcore']).default('pro'),
  status: z.enum(['draft', 'published', 'cancelled']).default('published'),
})

export const updateEventSchema = createEventSchema

export const contactRequestSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  whatsapp: z
    .string()
    .trim()
    .min(8, 'El número debe tener al menos 8 dígitos')
    .max(20, 'Número demasiado largo')
    .regex(/^[\d+\s\-()]+$/, 'Solo números y caracteres de teléfono')
    .transform((value) => value.replace(/\D/g, ''))
    .refine((digits) => digits.length >= 8, 'Número de WhatsApp inválido'),
  machine: z.string().trim().min(2, 'Indica tu máquina').max(120),
})

export const eventRsvpSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  email: z.string().email('Email inválido').transform((value) => value.toLowerCase().trim()),
  machine: z
    .union([z.literal(''), z.string().trim().max(120)])
    .optional()
    .transform((value) => (value ? value : undefined)),
})

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  motorcycle: z
    .union([z.literal(''), z.string().trim().max(120)])
    .optional()
    .transform((value) => (value ? value : undefined)),
  bio: z
    .union([z.literal(''), z.string().trim().max(280, 'La bio no puede superar 280 caracteres')])
    .optional()
    .transform((value) => (value ? value : undefined)),
  profilePublic: z.boolean().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
})

export const adminUpdateUserSchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => value.role !== undefined || value.isActive !== undefined, {
  message: 'Indica un cambio de rol o estado',
})

export const createSocialWorkSchema = z.object({
  title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(160),
  description: z.string().trim().min(10, 'La descripción debe tener al menos 10 caracteres').max(5000),
  status: z.enum(['draft', 'published']).default('draft'),
})

export const updateSocialWorkSchema = createSocialWorkSchema

export const addSocialWorkVideoSchema = z
  .object({
    videoUrl: externalVideoUrlSchema.optional(),
    youtubeUrl: externalVideoUrlSchema.optional(),
    title: z
      .union([z.literal(''), z.string().trim().max(160)])
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .refine((value) => Boolean(value.videoUrl || value.youtubeUrl), {
    message: 'La URL del video es requerida',
    path: ['videoUrl'],
  })
  .transform((value) => ({
    videoUrl: (value.videoUrl ?? value.youtubeUrl)!,
    title: value.title,
  }))

export const createPostSchema = z.object({
  body: z.string().trim().min(1, 'La descripción es requerida').max(2000, 'La descripción es demasiado larga'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
export type CreateYoutubeMediaInput = z.infer<typeof createYoutubeMediaSchema>
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
export type ContactRequestInput = z.infer<typeof contactRequestSchema>
export type EventRsvpInput = z.infer<typeof eventRsvpSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>
export type CreateSocialWorkInput = z.infer<typeof createSocialWorkSchema>
export type UpdateSocialWorkInput = z.infer<typeof updateSocialWorkSchema>
export type AddSocialWorkVideoInput = z.infer<typeof addSocialWorkVideoSchema>
export type CreatePostInput = z.infer<typeof createPostSchema>

// ─── Garage ──────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear()

export const createVehicleSchema = z.object({
  brand: z.string().trim().min(2, 'La marca debe tener al menos 2 caracteres').max(80),
  model: z.string().trim().min(2, 'El modelo debe tener al menos 2 caracteres').max(80),
  year: z
    .number({ invalid_type_error: 'El año debe ser un número' })
    .int()
    .min(1950, 'Año muy antiguo')
    .max(currentYear + 1, 'Año inválido'),
  engineCc: z
    .number({ invalid_type_error: 'La cilindrada debe ser un número' })
    .int()
    .min(50, 'Cilindrada mínima 50 cc')
    .max(3000, 'Cilindrada máxima 3000 cc')
    .optional(),
  plate: z
    .union([z.literal(''), z.string().trim().max(10)])
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
  color: z
    .union([z.literal(''), z.string().trim().max(40)])
    .optional()
    .transform((v) => (v ? v : undefined)),
  odometerKm: z
    .number({ invalid_type_error: 'El odómetro debe ser un número' })
    .int()
    .min(0, 'El odómetro no puede ser negativo')
    .max(1_000_000, 'Valor de odómetro inválido')
    .optional()
    .default(0),
  purchaseDate: z
    .union([z.literal(''), z.string().trim()])
    .optional()
    .transform((v) => (v ? v : undefined)),
  notes: z
    .union([z.literal(''), z.string().trim().max(1000)])
    .optional()
    .transform((v) => (v ? v : undefined)),
})

export const updateVehicleSchema = createVehicleSchema.partial()

export const createMaintenanceSchema = z.object({
  type: z.enum([
    'oil_change', 'oil_filter', 'air_filter', 'brakes', 'tires', 'chain',
    'spark_plugs', 'battery', 'suspension', 'electrical', 'general_service', 'repair', 'other',
  ] as const, { invalid_type_error: 'Tipo de mantenimiento inválido' }),
  title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres').max(160),
  performedAt: z.string().min(1, 'La fecha es requerida'),
  odometerKm: z
    .number({ invalid_type_error: 'El odómetro debe ser un número' })
    .int()
    .min(0)
    .max(1_000_000)
    .optional(),
  workshop: z
    .union([z.literal(''), z.string().trim().max(120)])
    .optional()
    .transform((v) => (v ? v : undefined)),
  cost: z
    .number({ invalid_type_error: 'El costo debe ser un número' })
    .int()
    .min(0, 'El costo no puede ser negativo')
    .optional(),
  parts: z
    .union([z.literal(''), z.string().trim().max(500)])
    .optional()
    .transform((v) => (v ? v : undefined)),
  notes: z
    .union([z.literal(''), z.string().trim().max(1000)])
    .optional()
    .transform((v) => (v ? v : undefined)),
})

export const updateMaintenanceSchema = createMaintenanceSchema.partial()

export const createExpenseSchema = z.object({
  category: z.enum([
    'maintenance', 'fuel', 'soat', 'tecnomecanica', 'taxes', 'insurance',
    'accessories', 'gear', 'tolls', 'fines', 'parking', 'other',
  ] as const, { invalid_type_error: 'Categoría de gasto inválida' }),
  amount: z
    .number({ invalid_type_error: 'El monto debe ser un número' })
    .int()
    .min(0, 'El monto no puede ser negativo'),
  spentAt: z.string().min(1, 'La fecha es requerida'),
  description: z.string().trim().min(2, 'La descripción es requerida').max(200),
  odometerKm: z
    .number({ invalid_type_error: 'El odómetro debe ser un número' })
    .int()
    .min(0)
    .max(1_000_000)
    .optional(),
  liters: z
    .number({ invalid_type_error: 'Los litros deben ser un número' })
    .int()
    .min(0)
    .optional(),
  maintenanceRecordId: z.string().uuid().optional(),
})

export const createReminderSchema = z
  .object({
    type: z.enum([
      'oil_change', 'oil_filter', 'air_filter', 'brakes', 'tires', 'chain',
      'spark_plugs', 'battery', 'suspension', 'electrical', 'general_service', 'repair', 'other',
    ] as const, { invalid_type_error: 'Tipo de recordatorio inválido' }),
    title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres').max(160),
    intervalKm: z
      .number({ invalid_type_error: 'El intervalo de km debe ser un número' })
      .int()
      .min(1, 'El intervalo debe ser mayor a 0')
      .max(100_000)
      .optional(),
    intervalMonths: z
      .number({ invalid_type_error: 'El intervalo de meses debe ser un número' })
      .int()
      .min(1, 'El intervalo debe ser mayor a 0')
      .max(120)
      .optional(),
    notes: z
      .union([z.literal(''), z.string().trim().max(500)])
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .refine((v) => v.intervalKm !== undefined || v.intervalMonths !== undefined, {
    message: 'Indica al menos un intervalo (km o meses)',
    path: ['intervalKm'],
  })

export const updateReminderSchema = z.object({
  title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres').max(160).optional(),
  intervalKm: z.number().int().min(1).max(100_000).optional(),
  intervalMonths: z.number().int().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
  notes: z
    .union([z.literal(''), z.string().trim().max(500)])
    .optional()
    .transform((v) => (v !== undefined ? (v ? v : null) : undefined)),
})

export const completeReminderSchema = z.object({
  odometerKm: z
    .number({ invalid_type_error: 'El odómetro debe ser un número' })
    .int()
    .min(0)
    .max(1_000_000)
    .optional(),
  doneAt: z.string().optional(),
})

export const createDocumentSchema = z.object({
  kind: z.enum(['soat', 'tecnomecanica', 'taxes', 'insurance', 'license', 'other'] as const, {
    invalid_type_error: 'Tipo de documento inválido',
  }),
  number: z
    .union([z.literal(''), z.string().trim().max(60)])
    .optional()
    .transform((v) => (v ? v : undefined)),
  issuedAt: z
    .union([z.literal(''), z.string().trim()])
    .optional()
    .transform((v) => (v ? v : undefined)),
  expiresAt: z.string().min(1, 'La fecha de vencimiento es requerida'),
  notes: z
    .union([z.literal(''), z.string().trim().max(500)])
    .optional()
    .transform((v) => (v ? v : undefined)),
})

export const updateDocumentSchema = createDocumentSchema.partial()

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type CreateReminderInput = z.infer<typeof createReminderSchema>
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>
export type CompleteReminderInput = z.infer<typeof completeReminderSchema>
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
