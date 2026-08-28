export type VehicleStatus = 'active' | 'sold' | 'inactive'

export type MaintenanceType =
  | 'oil_change'
  | 'oil_filter'
  | 'air_filter'
  | 'brakes'
  | 'tires'
  | 'chain'
  | 'spark_plugs'
  | 'battery'
  | 'suspension'
  | 'electrical'
  | 'general_service'
  | 'repair'
  | 'other'

export type ExpenseCategory =
  | 'maintenance'
  | 'fuel'
  | 'soat'
  | 'tecnomecanica'
  | 'taxes'
  | 'insurance'
  | 'accessories'
  | 'gear'
  | 'tolls'
  | 'fines'
  | 'parking'
  | 'other'

export type VehicleDocumentKind = 'soat' | 'tecnomecanica' | 'taxes' | 'insurance' | 'license' | 'other'

export type DocumentStatus = 'ok' | 'expiring' | 'expired'

export type ReminderStatus = {
  status: 'ok' | 'due_soon' | 'overdue'
  kmRemaining: number | null
  daysRemaining: number | null
  dueOdometerKm: number | null
  dueDate: string | null
}

export type Vehicle = {
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
  status: VehicleStatus
  isPrimary: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type MaintenanceRecord = {
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

export type VehicleExpense = {
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

export type MaintenanceReminder = {
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

export type VehicleDocument = {
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
  vehicles: Vehicle[]
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

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  oil_change: 'Cambio de aceite',
  oil_filter: 'Filtro de aceite',
  air_filter: 'Filtro de aire',
  brakes: 'Frenos',
  tires: 'Llantas',
  chain: 'Cadena',
  spark_plugs: 'Bujías',
  battery: 'Batería',
  suspension: 'Suspensión',
  electrical: 'Eléctrica',
  general_service: 'Servicio general',
  repair: 'Reparación',
  other: 'Otro',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  maintenance: 'Mantenimiento',
  fuel: 'Combustible',
  soat: 'SOAT',
  tecnomecanica: 'Tecnomecánica',
  taxes: 'Impuestos',
  insurance: 'Seguro',
  accessories: 'Accesorios',
  gear: 'Equipamiento',
  tolls: 'Peajes',
  fines: 'Multas',
  parking: 'Parqueadero',
  other: 'Otro',
}

export const DOCUMENT_KIND_LABELS: Record<VehicleDocumentKind, string> = {
  soat: 'SOAT',
  tecnomecanica: 'Tecnomecánica',
  taxes: 'Impuesto',
  insurance: 'Seguro todo riesgo',
  license: 'Licencia de tránsito',
  other: 'Otro',
}

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  active: 'Activa',
  sold: 'Vendida',
  inactive: 'Inactiva',
}
