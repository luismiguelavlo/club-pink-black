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

export const createYoutubeMediaSchema = z.object({
  title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres').max(160),
  youtubeUrl: z.string().url('URL inválida').min(10),
})

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
  email: z.string().email('Email inválido').transform((value) => value.toLowerCase().trim()),
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

export const addSocialWorkVideoSchema = z.object({
  youtubeUrl: z.string().url('URL inválida').min(10),
  title: z
    .union([z.literal(''), z.string().trim().max(160)])
    .optional()
    .transform((value) => (value ? value : undefined)),
})

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
