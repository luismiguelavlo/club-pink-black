import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import type { PartyRoomState } from '../../shared/types/party-games'

export const userRoleEnum = pgEnum('user_role', ['admin', 'user'])
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'revoked', 'expired'])
export const mediaKindEnum = pgEnum('media_kind', ['photo', 'video'])
export const videoProviderEnum = pgEnum('video_provider', ['youtube', 'tiktok'])
export const notificationTypeEnum = pgEnum('notification_type', [
  'comment',
  'ignite',
  'event',
  'rsvp',
  'system',
  'maintenance',
])

export const vehicleStatusEnum = pgEnum('vehicle_status', ['active', 'sold', 'inactive'])

export const maintenanceTypeEnum = pgEnum('maintenance_type', [
  'oil_change',
  'oil_filter',
  'air_filter',
  'brakes',
  'tires',
  'chain',
  'spark_plugs',
  'battery',
  'suspension',
  'electrical',
  'general_service',
  'repair',
  'other',
])

export const expenseCategoryEnum = pgEnum('expense_category', [
  'maintenance',
  'fuel',
  'soat',
  'tecnomecanica',
  'taxes',
  'insurance',
  'accessories',
  'gear',
  'tolls',
  'fines',
  'parking',
  'other',
])

export const vehicleDocumentKindEnum = pgEnum('vehicle_document_kind', [
  'soat',
  'tecnomecanica',
  'taxes',
  'insurance',
  'license',
  'other',
])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  motorcycle: text('motorcycle'),
  avatarUrl: text('avatar_url'),
  avatarCloudinaryPublicId: text('avatar_cloudinary_public_id'),
  bio: text('bio'),
  profilePublic: boolean('profile_public').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userGalleryImages = pgTable('user_gallery_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  cloudinaryPublicId: text('cloudinary_public_id').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  bytes: integer('bytes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const invites = pgTable('invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  email: text('email'),
  role: userRoleEnum('role').notNull().default('user'),
  status: inviteStatusEnum('status').notNull().default('pending'),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id),
  acceptedById: uuid('accepted_by_id').references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const mediaItems = pgTable('media_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: mediaKindEnum('kind').notNull(),
  title: text('title').notNull(),
  imageUrl: text('image_url'),
  cloudinaryPublicId: text('cloudinary_public_id'),
  bytes: integer('bytes'),
  youtubeUrl: text('youtube_url'),
  youtubeId: text('youtube_id'),
  videoProvider: videoProviderEnum('video_provider').default('youtube'),
  thumbnailUrl: text('thumbnail_url'),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const postImages = pgTable('post_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  cloudinaryPublicId: text('cloudinary_public_id').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  bytes: integer('bytes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const postIgnites = pgTable(
  'post_ignites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('post_ignites_post_user_idx').on(table.postId, table.userId)],
)

export const eventDifficultyEnum = pgEnum('event_difficulty', ['beginner', 'pro', 'hardcore'])
export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'cancelled'])
export const socialWorkStatusEnum = pgEnum('social_work_status', ['draft', 'published'])

export const clubEvents = pgTable('club_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  location: text('location').notNull(),
  difficulty: eventDifficultyEnum('difficulty').notNull().default('pro'),
  status: eventStatusEnum('status').notNull().default('published'),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const contactRequests = pgTable('contact_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  whatsapp: text('whatsapp').notNull(),
  machine: text('machine').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const eventRsvps = pgTable(
  'event_rsvps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => clubEvents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    machine: text('machine'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('event_rsvps_event_email_idx').on(table.eventId, table.email),
    uniqueIndex('event_rsvps_event_user_idx').on(table.eventId, table.userId),
  ],
)

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull().default('system'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  href: text('href'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const socialWorkPosts = pgTable('social_work_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: socialWorkStatusEnum('status').notNull().default('draft'),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const socialWorkImages = pgTable('social_work_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .notNull()
    .references(() => socialWorkPosts.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  cloudinaryPublicId: text('cloudinary_public_id').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  bytes: integer('bytes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const socialWorkVideos = pgTable('social_work_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .notNull()
    .references(() => socialWorkPosts.id, { onDelete: 'cascade' }),
  youtubeUrl: text('youtube_url').notNull(),
  youtubeId: text('youtube_id').notNull(),
  videoProvider: videoProviderEnum('video_provider').notNull().default('youtube'),
  thumbnailUrl: text('thumbnail_url'),
  title: text('title'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  engineCc: integer('engine_cc'),
  plate: text('plate'),
  color: text('color'),
  imageUrl: text('image_url'),
  cloudinaryPublicId: text('cloudinary_public_id'),
  odometerKm: integer('odometer_km').notNull().default(0),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }),
  status: vehicleStatusEnum('status').notNull().default('active'),
  isPrimary: boolean('is_primary').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const maintenanceRecords = pgTable('maintenance_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  type: maintenanceTypeEnum('type').notNull(),
  title: text('title').notNull(),
  performedAt: timestamp('performed_at', { withTimezone: true }).notNull(),
  odometerKm: integer('odometer_km'),
  workshop: text('workshop'),
  cost: integer('cost'),
  parts: text('parts'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vehicleExpenses = pgTable('vehicle_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  category: expenseCategoryEnum('category').notNull(),
  amount: integer('amount').notNull(),
  spentAt: timestamp('spent_at', { withTimezone: true }).notNull(),
  description: text('description').notNull(),
  odometerKm: integer('odometer_km'),
  liters: integer('liters'),
  receiptUrl: text('receipt_url'),
  receiptCloudinaryPublicId: text('receipt_cloudinary_public_id'),
  maintenanceRecordId: uuid('maintenance_record_id').references(() => maintenanceRecords.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const maintenanceReminders = pgTable('maintenance_reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  type: maintenanceTypeEnum('type').notNull(),
  title: text('title').notNull(),
  intervalKm: integer('interval_km'),
  intervalMonths: integer('interval_months'),
  lastDoneAt: timestamp('last_done_at', { withTimezone: true }),
  lastDoneOdometerKm: integer('last_done_odometer_km'),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vehicleDocuments = pgTable('vehicle_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  kind: vehicleDocumentKindEnum('kind').notNull(),
  number: text('number'),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  fileUrl: text('file_url'),
  cloudinaryPublicId: text('cloudinary_public_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserGalleryImage = typeof userGalleryImages.$inferSelect
export type UserRole = 'admin' | 'user'
export type Invite = typeof invites.$inferSelect
export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired'
export type MediaItem = typeof mediaItems.$inferSelect
export type MediaKind = 'photo' | 'video'
export type VideoProvider = 'youtube' | 'tiktok'
export type Post = typeof posts.$inferSelect
export type PostImage = typeof postImages.$inferSelect
export type Comment = typeof comments.$inferSelect
export type PostIgnite = typeof postIgnites.$inferSelect
export type ClubEvent = typeof clubEvents.$inferSelect
export type EventDifficulty = 'beginner' | 'pro' | 'hardcore'
export type EventStatus = 'draft' | 'published' | 'cancelled'
export type ContactRequest = typeof contactRequests.$inferSelect
export type EventRsvp = typeof eventRsvps.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type NotificationType = 'comment' | 'ignite' | 'event' | 'rsvp' | 'system'
export type SocialWorkPost = typeof socialWorkPosts.$inferSelect
export type SocialWorkImage = typeof socialWorkImages.$inferSelect
export type SocialWorkVideo = typeof socialWorkVideos.$inferSelect
export type SocialWorkStatus = 'draft' | 'published'

export type Vehicle = typeof vehicles.$inferSelect
export type NewVehicle = typeof vehicles.$inferInsert
export type VehicleStatus = 'active' | 'sold' | 'inactive'
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect
export type NewMaintenanceRecord = typeof maintenanceRecords.$inferInsert
export type MaintenanceType = 'oil_change' | 'oil_filter' | 'air_filter' | 'brakes' | 'tires' | 'chain' | 'spark_plugs' | 'battery' | 'suspension' | 'electrical' | 'general_service' | 'repair' | 'other'
export type VehicleExpense = typeof vehicleExpenses.$inferSelect
export type NewVehicleExpense = typeof vehicleExpenses.$inferInsert
export type ExpenseCategory = 'maintenance' | 'fuel' | 'soat' | 'tecnomecanica' | 'taxes' | 'insurance' | 'accessories' | 'gear' | 'tolls' | 'fines' | 'parking' | 'other'
export type MaintenanceReminder = typeof maintenanceReminders.$inferSelect
export type NewMaintenanceReminder = typeof maintenanceReminders.$inferInsert
export type VehicleDocument = typeof vehicleDocuments.$inferSelect
export type NewVehicleDocument = typeof vehicleDocuments.$inferInsert
export type VehicleDocumentKind = 'soat' | 'tecnomecanica' | 'taxes' | 'insurance' | 'license' | 'other'

export const partyGameTypeEnum = pgEnum('party_game_type', ['infiltrado', 'bomba', 'no-piso', 'mentiroso', 'hockey-aire-online'])

export const partyRooms = pgTable('party_rooms', {
  code: text('code').primaryKey(),
  gameType: partyGameTypeEnum('game_type').notNull(),
  hostUserId: uuid('host_user_id').notNull(),
  state: jsonb('state').$type<PartyRoomState>().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PartyRoomRow = typeof partyRooms.$inferSelect
export type NewPartyRoomRow = typeof partyRooms.$inferInsert
