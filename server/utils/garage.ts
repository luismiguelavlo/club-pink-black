import { and, asc, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import {
  maintenanceRecords,
  maintenanceReminders,
  notifications,
  vehicleDocuments,
  vehicleExpenses,
  vehicles,
  type ExpenseCategory,
  type MaintenanceType,
  type VehicleDocumentKind,
} from '../database/schema'
import { useDb } from './db'
import { createNotification } from './notifications'
import type {
  CreateDocumentInput,
  CreateExpenseInput,
  CreateMaintenanceInput,
  CreateReminderInput,
  CreateVehicleInput,
  UpdateDocumentInput,
  UpdateMaintenanceInput,
  UpdateReminderInput,
  UpdateVehicleInput,
  CompleteReminderInput,
} from './validation'

// ─── Public DTOs ──────────────────────────────────────────────────────────────

export type PublicVehicle = {
  id: string
  userId: string
  brand: string
  model: string
  year: number
  engineCc: number | null
  plate: string | null
  color: string | null
  imageUrl: string | null
  odometerKm: number
  purchaseDate: string | null
  status: string
  isPrimary: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type PublicMaintenance = {
  id: string
  vehicleId: string
  type: MaintenanceType
  title: string
  performedAt: string
  odometerKm: number | null
  workshop: string | null
  cost: number | null
  parts: string | null
  notes: string | null
  createdAt: string
}

export type PublicExpense = {
  id: string
  vehicleId: string
  category: ExpenseCategory
  amount: number
  spentAt: string
  description: string
  odometerKm: number | null
  liters: number | null
  receiptUrl: string | null
  maintenanceRecordId: string | null
  createdAt: string
}

export type ReminderStatus = {
  status: 'ok' | 'due_soon' | 'overdue'
  kmRemaining: number | null
  daysRemaining: number | null
  dueOdometerKm: number | null
  dueDate: string | null
}

export type PublicReminder = {
  id: string
  vehicleId: string
  type: MaintenanceType
  title: string
  intervalKm: number | null
  intervalMonths: number | null
  lastDoneAt: string | null
  lastDoneOdometerKm: number | null
  isActive: boolean
  notes: string | null
  reminderStatus: ReminderStatus
  createdAt: string
}

export type DocumentStatus = 'ok' | 'expiring' | 'expired'

export type PublicDocument = {
  id: string
  vehicleId: string
  kind: VehicleDocumentKind
  number: string | null
  issuedAt: string | null
  expiresAt: string
  fileUrl: string | null
  notes: string | null
  documentStatus: DocumentStatus
  daysUntilExpiry: number
  createdAt: string
}

export type GarageAlert = {
  vehicleId: string
  vehicleName: string
  type: 'reminder' | 'document'
  label: string
  status: 'overdue' | 'due_soon' | 'expired' | 'expiring'
  href: string
}

export type GarageOverview = {
  vehicles: PublicVehicle[]
  alerts: GarageAlert[]
  monthExpenses: number
  totalExpenses: number
}

export type VehicleStats = {
  totalExpenses: number
  byCategory: { category: ExpenseCategory; total: number }[]
  byMonth: { month: string; total: number }[]
  costPerKm: number | null
  avgMonthly: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toVehicle(r: typeof vehicles.$inferSelect): PublicVehicle {
  return {
    id: r.id,
    userId: r.userId,
    brand: r.brand,
    model: r.model,
    year: r.year,
    engineCc: r.engineCc ?? null,
    plate: r.plate ?? null,
    color: r.color ?? null,
    imageUrl: r.imageUrl ?? null,
    odometerKm: r.odometerKm,
    purchaseDate: r.purchaseDate?.toISOString() ?? null,
    status: r.status,
    isPrimary: r.isPrimary,
    notes: r.notes ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

function toMaintenance(r: typeof maintenanceRecords.$inferSelect): PublicMaintenance {
  return {
    id: r.id,
    vehicleId: r.vehicleId,
    type: r.type as MaintenanceType,
    title: r.title,
    performedAt: r.performedAt.toISOString(),
    odometerKm: r.odometerKm ?? null,
    workshop: r.workshop ?? null,
    cost: r.cost ?? null,
    parts: r.parts ?? null,
    notes: r.notes ?? null,
    createdAt: r.createdAt.toISOString(),
  }
}

function toExpense(r: typeof vehicleExpenses.$inferSelect): PublicExpense {
  return {
    id: r.id,
    vehicleId: r.vehicleId,
    category: r.category as ExpenseCategory,
    amount: r.amount,
    spentAt: r.spentAt.toISOString(),
    description: r.description,
    odometerKm: r.odometerKm ?? null,
    liters: r.liters ?? null,
    receiptUrl: r.receiptUrl ?? null,
    maintenanceRecordId: r.maintenanceRecordId ?? null,
    createdAt: r.createdAt.toISOString(),
  }
}

function toDocument(r: typeof vehicleDocuments.$inferSelect): PublicDocument {
  const now = new Date()
  const expires = new Date(r.expiresAt)
  const daysUntilExpiry = Math.ceil((expires.getTime() - now.getTime()) / 86_400_000)
  let documentStatus: DocumentStatus = 'ok'
  if (daysUntilExpiry < 0) documentStatus = 'expired'
  else if (daysUntilExpiry <= 30) documentStatus = 'expiring'

  return {
    id: r.id,
    vehicleId: r.vehicleId,
    kind: r.kind as VehicleDocumentKind,
    number: r.number ?? null,
    issuedAt: r.issuedAt?.toISOString() ?? null,
    expiresAt: r.expiresAt.toISOString(),
    fileUrl: r.fileUrl ?? null,
    notes: r.notes ?? null,
    documentStatus,
    daysUntilExpiry,
    createdAt: r.createdAt.toISOString(),
  }
}

// ─── computeReminderStatus ───────────────────────────────────────────────────

export function computeReminderStatus(
  reminder: typeof maintenanceReminders.$inferSelect,
  odometerKm: number,
): ReminderStatus {
  const KM_WARN = 500
  const DAYS_WARN = 15
  const now = new Date()

  let status: ReminderStatus['status'] = 'ok'
  let kmRemaining: number | null = null
  let daysRemaining: number | null = null
  let dueOdometerKm: number | null = null
  let dueDate: string | null = null

  if (reminder.intervalKm && reminder.lastDoneOdometerKm !== null) {
    dueOdometerKm = reminder.lastDoneOdometerKm + reminder.intervalKm
    kmRemaining = dueOdometerKm - odometerKm
    if (kmRemaining <= 0) status = 'overdue'
    else if (kmRemaining <= KM_WARN) status = 'due_soon'
  }
  else if (reminder.intervalKm && reminder.lastDoneOdometerKm === null) {
    // No se ha hecho nunca — asumimos overdue si ya hay km registrados
    dueOdometerKm = reminder.intervalKm
    kmRemaining = dueOdometerKm - odometerKm
    if (odometerKm >= reminder.intervalKm) status = 'overdue'
  }

  if (reminder.intervalMonths && reminder.lastDoneAt) {
    const due = new Date(reminder.lastDoneAt)
    due.setMonth(due.getMonth() + reminder.intervalMonths)
    dueDate = due.toISOString()
    const days = Math.ceil((due.getTime() - now.getTime()) / 86_400_000)
    daysRemaining = days
    if (days <= 0 && (status === 'ok' || status === 'due_soon')) status = 'overdue'
    else if (days <= DAYS_WARN && status === 'ok') status = 'due_soon'
  }
  else if (reminder.intervalMonths && !reminder.lastDoneAt) {
    status = 'overdue'
  }

  return { status, kmRemaining, daysRemaining, dueOdometerKm, dueDate }
}

function toReminder(
  r: typeof maintenanceReminders.$inferSelect,
  odometerKm: number,
): PublicReminder {
  return {
    id: r.id,
    vehicleId: r.vehicleId,
    type: r.type as MaintenanceType,
    title: r.title,
    intervalKm: r.intervalKm ?? null,
    intervalMonths: r.intervalMonths ?? null,
    lastDoneAt: r.lastDoneAt?.toISOString() ?? null,
    lastDoneOdometerKm: r.lastDoneOdometerKm ?? null,
    isActive: r.isActive,
    notes: r.notes ?? null,
    reminderStatus: computeReminderStatus(r, odometerKm),
    createdAt: r.createdAt.toISOString(),
  }
}

// ─── assertVehicleOwnership ──────────────────────────────────────────────────

export async function assertVehicleOwnership(vehicleId: string, userId: string) {
  const db = useDb()
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId))
  if (!vehicle) throw createError({ statusCode: 404, statusMessage: 'Vehículo no encontrado' })
  if (vehicle.userId !== userId) throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })
  return vehicle
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export async function listUserVehicles(userId: string): Promise<PublicVehicle[]> {
  const db = useDb()
  const rows = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.userId, userId))
    .orderBy(desc(vehicles.isPrimary), asc(vehicles.createdAt))
  return rows.map(toVehicle)
}

export async function getVehicleDetail(vehicleId: string): Promise<PublicVehicle | null> {
  const db = useDb()
  const [row] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId))
  return row ? toVehicle(row) : null
}

export async function createVehicle(userId: string, input: CreateVehicleInput): Promise<PublicVehicle> {
  const db = useDb()
  const purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : null
  if (purchaseDate && Number.isNaN(purchaseDate.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Fecha de compra inválida' })
  }

  const [row] = await db
    .insert(vehicles)
    .values({
      userId,
      brand: input.brand,
      model: input.model,
      year: input.year,
      engineCc: input.engineCc ?? null,
      plate: input.plate ?? null,
      color: input.color ?? null,
      odometerKm: input.odometerKm ?? 0,
      purchaseDate: purchaseDate ?? null,
      notes: input.notes ?? null,
    })
    .returning()
  return toVehicle(row)
}

export async function updateVehicle(vehicleId: string, input: UpdateVehicleInput): Promise<PublicVehicle> {
  const db = useDb()
  const updates: Partial<typeof vehicles.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (input.brand !== undefined) updates.brand = input.brand
  if (input.model !== undefined) updates.model = input.model
  if (input.year !== undefined) updates.year = input.year
  if (input.engineCc !== undefined) updates.engineCc = input.engineCc ?? null
  if (input.plate !== undefined) updates.plate = input.plate ?? null
  if (input.color !== undefined) updates.color = input.color ?? null
  if (input.odometerKm !== undefined) updates.odometerKm = input.odometerKm
  if (input.notes !== undefined) updates.notes = input.notes ?? null
  if (input.purchaseDate !== undefined) {
    const d = input.purchaseDate ? new Date(input.purchaseDate) : null
    if (d && Number.isNaN(d.getTime())) throw createError({ statusCode: 400, statusMessage: 'Fecha inválida' })
    updates.purchaseDate = d
  }

  const [row] = await db.update(vehicles).set(updates).where(eq(vehicles.id, vehicleId)).returning()
  return toVehicle(row)
}

export async function deleteVehicle(vehicleId: string) {
  const db = useDb()
  await db.delete(vehicles).where(eq(vehicles.id, vehicleId))
}

export async function setPrimaryVehicle(vehicleId: string, userId: string) {
  const db = useDb()
  await db.update(vehicles).set({ isPrimary: false, updatedAt: new Date() }).where(eq(vehicles.userId, userId))
  await db.update(vehicles).set({ isPrimary: true, updatedAt: new Date() }).where(eq(vehicles.id, vehicleId))
}

export async function setVehicleImage(vehicleId: string, imageUrl: string, cloudinaryPublicId: string) {
  const db = useDb()
  const [row] = await db
    .update(vehicles)
    .set({ imageUrl, cloudinaryPublicId, updatedAt: new Date() })
    .where(eq(vehicles.id, vehicleId))
    .returning()
  return toVehicle(row)
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

export async function listMaintenance(vehicleId: string): Promise<PublicMaintenance[]> {
  const db = useDb()
  const rows = await db
    .select()
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.vehicleId, vehicleId))
    .orderBy(desc(maintenanceRecords.performedAt))
  return rows.map(toMaintenance)
}

export async function createMaintenanceRecord(
  vehicleId: string,
  input: CreateMaintenanceInput,
): Promise<PublicMaintenance> {
  const db = useDb()
  const performedAt = new Date(input.performedAt)
  if (Number.isNaN(performedAt.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Fecha de mantenimiento inválida' })
  }

  const [record] = await db
    .insert(maintenanceRecords)
    .values({
      vehicleId,
      type: input.type,
      title: input.title,
      performedAt,
      odometerKm: input.odometerKm ?? null,
      workshop: input.workshop ?? null,
      cost: input.cost ?? null,
      parts: input.parts ?? null,
      notes: input.notes ?? null,
    })
    .returning()

  // Update vehicle odometer if new reading is higher
  if (input.odometerKm !== undefined) {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId))
    if (vehicle && input.odometerKm > vehicle.odometerKm) {
      await db.update(vehicles).set({ odometerKm: input.odometerKm, updatedAt: new Date() }).where(eq(vehicles.id, vehicleId))
    }
    // Update matching reminder's lastDone fields
    await db
      .update(maintenanceReminders)
      .set({
        lastDoneAt: performedAt,
        lastDoneOdometerKm: input.odometerKm ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(maintenanceReminders.vehicleId, vehicleId),
          eq(maintenanceReminders.type, input.type),
        ),
      )
  }

  return toMaintenance(record)
}

export async function updateMaintenanceRecord(recordId: string, input: UpdateMaintenanceInput): Promise<PublicMaintenance> {
  const db = useDb()
  const updates: Partial<typeof maintenanceRecords.$inferInsert> = { updatedAt: new Date() }
  if (input.type !== undefined) updates.type = input.type
  if (input.title !== undefined) updates.title = input.title
  if (input.performedAt !== undefined) {
    const d = new Date(input.performedAt)
    if (Number.isNaN(d.getTime())) throw createError({ statusCode: 400, statusMessage: 'Fecha inválida' })
    updates.performedAt = d
  }
  if (input.odometerKm !== undefined) updates.odometerKm = input.odometerKm ?? null
  if (input.workshop !== undefined) updates.workshop = input.workshop ?? null
  if (input.cost !== undefined) updates.cost = input.cost ?? null
  if (input.parts !== undefined) updates.parts = input.parts ?? null
  if (input.notes !== undefined) updates.notes = input.notes ?? null

  const [row] = await db.update(maintenanceRecords).set(updates).where(eq(maintenanceRecords.id, recordId)).returning()
  return toMaintenance(row)
}

export async function deleteMaintenanceRecord(recordId: string) {
  const db = useDb()
  await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id, recordId))
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function listExpenses(vehicleId: string): Promise<PublicExpense[]> {
  const db = useDb()
  const rows = await db
    .select()
    .from(vehicleExpenses)
    .where(eq(vehicleExpenses.vehicleId, vehicleId))
    .orderBy(desc(vehicleExpenses.spentAt))
  return rows.map(toExpense)
}

export async function createExpense(vehicleId: string, input: CreateExpenseInput): Promise<PublicExpense> {
  const db = useDb()
  const spentAt = new Date(input.spentAt)
  if (Number.isNaN(spentAt.getTime())) throw createError({ statusCode: 400, statusMessage: 'Fecha de gasto inválida' })

  const [row] = await db
    .insert(vehicleExpenses)
    .values({
      vehicleId,
      category: input.category,
      amount: input.amount,
      spentAt,
      description: input.description,
      odometerKm: input.odometerKm ?? null,
      liters: input.liters ?? null,
      maintenanceRecordId: input.maintenanceRecordId ?? null,
    })
    .returning()
  return toExpense(row)
}

export async function deleteExpense(expenseId: string) {
  const db = useDb()
  await db.delete(vehicleExpenses).where(eq(vehicleExpenses.id, expenseId))
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export async function listReminders(vehicleId: string, odometerKm: number): Promise<PublicReminder[]> {
  const db = useDb()
  const rows = await db
    .select()
    .from(maintenanceReminders)
    .where(eq(maintenanceReminders.vehicleId, vehicleId))
    .orderBy(asc(maintenanceReminders.createdAt))
  return rows.map((r) => toReminder(r, odometerKm))
}

export async function createReminder(vehicleId: string, input: CreateReminderInput, odometerKm: number): Promise<PublicReminder> {
  const db = useDb()
  const [row] = await db
    .insert(maintenanceReminders)
    .values({
      vehicleId,
      type: input.type,
      title: input.title,
      intervalKm: input.intervalKm ?? null,
      intervalMonths: input.intervalMonths ?? null,
      notes: input.notes ?? null,
    })
    .returning()
  return toReminder(row, odometerKm)
}

export async function updateReminder(reminderId: string, input: UpdateReminderInput, odometerKm: number): Promise<PublicReminder> {
  const db = useDb()
  const updates: Partial<typeof maintenanceReminders.$inferInsert> = { updatedAt: new Date() }
  if (input.title !== undefined) updates.title = input.title
  if (input.intervalKm !== undefined) updates.intervalKm = input.intervalKm ?? null
  if (input.intervalMonths !== undefined) updates.intervalMonths = input.intervalMonths ?? null
  if (input.isActive !== undefined) updates.isActive = input.isActive
  if (input.notes !== undefined) updates.notes = input.notes as string | null | undefined

  const [row] = await db.update(maintenanceReminders).set(updates).where(eq(maintenanceReminders.id, reminderId)).returning()
  return toReminder(row, odometerKm)
}

export async function deleteReminder(reminderId: string) {
  const db = useDb()
  await db.delete(maintenanceReminders).where(eq(maintenanceReminders.id, reminderId))
}

export async function completeReminder(reminderId: string, input: CompleteReminderInput, odometerKm: number): Promise<PublicReminder> {
  const db = useDb()
  const doneAt = input.doneAt ? new Date(input.doneAt) : new Date()
  const [row] = await db
    .update(maintenanceReminders)
    .set({
      lastDoneAt: doneAt,
      lastDoneOdometerKm: input.odometerKm ?? null,
      updatedAt: new Date(),
    })
    .where(eq(maintenanceReminders.id, reminderId))
    .returning()
  return toReminder(row, odometerKm)
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function listDocuments(vehicleId: string): Promise<PublicDocument[]> {
  const db = useDb()
  const rows = await db
    .select()
    .from(vehicleDocuments)
    .where(eq(vehicleDocuments.vehicleId, vehicleId))
    .orderBy(asc(vehicleDocuments.expiresAt))
  return rows.map(toDocument)
}

export async function createDocument(vehicleId: string, input: CreateDocumentInput): Promise<PublicDocument> {
  const db = useDb()
  const expiresAt = new Date(input.expiresAt)
  if (Number.isNaN(expiresAt.getTime())) throw createError({ statusCode: 400, statusMessage: 'Fecha de vencimiento inválida' })
  const issuedAt = input.issuedAt ? new Date(input.issuedAt) : null

  const [row] = await db
    .insert(vehicleDocuments)
    .values({
      vehicleId,
      kind: input.kind,
      number: input.number ?? null,
      issuedAt,
      expiresAt,
      notes: input.notes ?? null,
    })
    .returning()
  return toDocument(row)
}

export async function updateDocument(documentId: string, input: UpdateDocumentInput): Promise<PublicDocument> {
  const db = useDb()
  const updates: Partial<typeof vehicleDocuments.$inferInsert> = { updatedAt: new Date() }
  if (input.kind !== undefined) updates.kind = input.kind
  if (input.number !== undefined) updates.number = input.number ?? null
  if (input.issuedAt !== undefined) {
    const d = input.issuedAt ? new Date(input.issuedAt) : null
    if (d && Number.isNaN(d.getTime())) throw createError({ statusCode: 400, statusMessage: 'Fecha de expedición inválida' })
    updates.issuedAt = d
  }
  if (input.expiresAt !== undefined) {
    const d = new Date(input.expiresAt)
    if (Number.isNaN(d.getTime())) throw createError({ statusCode: 400, statusMessage: 'Fecha de vencimiento inválida' })
    updates.expiresAt = d
  }
  if (input.notes !== undefined) updates.notes = input.notes ?? null

  const [row] = await db.update(vehicleDocuments).set(updates).where(eq(vehicleDocuments.id, documentId)).returning()
  return toDocument(row)
}

export async function deleteDocument(documentId: string) {
  const db = useDb()
  await db.delete(vehicleDocuments).where(eq(vehicleDocuments.id, documentId))
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export async function getGarageOverview(userId: string): Promise<GarageOverview> {
  const db = useDb()

  const userVehicles = await listUserVehicles(userId)

  const alerts: GarageAlert[] = []

  for (const v of userVehicles) {
    const vehicleName = `${v.brand} ${v.model}`

    const reminders = await db
      .select()
      .from(maintenanceReminders)
      .where(and(eq(maintenanceReminders.vehicleId, v.id), eq(maintenanceReminders.isActive, true)))
    for (const r of reminders) {
      const rs = computeReminderStatus(r, v.odometerKm)
      if (rs.status === 'overdue' || rs.status === 'due_soon') {
        alerts.push({
          vehicleId: v.id,
          vehicleName,
          type: 'reminder',
          label: r.title,
          status: rs.status,
          href: `/garage/${v.id}?tab=reminders`,
        })
      }
    }

    const docs = await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.vehicleId, v.id))
    for (const d of docs) {
      const ds = toDocument(d)
      if (ds.documentStatus === 'expired' || ds.documentStatus === 'expiring') {
        alerts.push({
          vehicleId: v.id,
          vehicleName,
          type: 'document',
          label: d.kind.toUpperCase(),
          status: ds.documentStatus === 'expired' ? 'expired' : 'expiring',
          href: `/garage/${v.id}?tab=documents`,
        })
      }
    }
  }

  // Sort: overdue/expired first
  alerts.sort((a, b) => {
    const order = { overdue: 0, expired: 0, due_soon: 1, expiring: 1 }
    return (order[a.status] ?? 2) - (order[b.status] ?? 2)
  })

  // Expenses this month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const vehicleIds = userVehicles.map((v) => v.id)

  let monthExpenses = 0
  let totalExpenses = 0

  if (vehicleIds.length > 0) {
    for (const vid of vehicleIds) {
      const allExp = await db.select().from(vehicleExpenses).where(eq(vehicleExpenses.vehicleId, vid))
      for (const e of allExp) {
        totalExpenses += e.amount
        if (e.spentAt >= monthStart) monthExpenses += e.amount
      }
    }
  }

  await syncGarageNotifications(userId, alerts)

  return { vehicles: userVehicles, alerts, monthExpenses, totalExpenses }
}

// ─── Vehicle Stats ─────────────────────────────────────────────────────────────

export async function getVehicleStats(vehicleId: string): Promise<VehicleStats> {
  const db = useDb()

  const allExpenses = await db.select().from(vehicleExpenses).where(eq(vehicleExpenses.vehicleId, vehicleId))
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId))

  const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0)

  // By category
  const categoryMap: Record<string, number> = {}
  for (const e of allExpenses) {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount
  }
  const byCategory = Object.entries(categoryMap).map(([category, total]) => ({
    category: category as ExpenseCategory,
    total,
  }))

  // By month (last 12)
  const byMonthMap: Record<string, number> = {}
  for (const e of allExpenses) {
    const d = new Date(e.spentAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    byMonthMap[key] = (byMonthMap[key] ?? 0) + e.amount
  }
  const now = new Date()
  const byMonth: { month: string; total: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    byMonth.push({ month: key, total: byMonthMap[key] ?? 0 })
  }

  // Cost per km
  let costPerKm: number | null = null
  if (vehicle && vehicle.odometerKm > 0) {
    costPerKm = Math.round(totalExpenses / vehicle.odometerKm)
  }

  // Average monthly (over months with at least one expense)
  const activeMonths = Object.keys(byMonthMap).length
  const avgMonthly = activeMonths > 0 ? Math.round(totalExpenses / activeMonths) : 0

  return { totalExpenses, byCategory, byMonth, costPerKm, avgMonthly }
}

// ─── Sync Notifications ───────────────────────────────────────────────────────

export async function syncGarageNotifications(userId: string, alerts: GarageAlert[]) {
  const db = useDb()
  const urgentAlerts = alerts.filter((a) => a.status === 'overdue' || a.status === 'expired')

  for (const alert of urgentAlerts) {
    // Check if unread notification for this href already exists
    const existing = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.href, alert.href),
          isNull(notifications.readAt),
        ),
      )
    if (existing.length > 0) continue

    await createNotification({
      userId,
      type: 'maintenance',
      title: alert.status === 'overdue' ? `Mantenimiento vencido: ${alert.label}` : `Documento vencido: ${alert.label}`,
      body: `${alert.vehicleName} requiere atención`,
      href: alert.href,
    })
  }
}
