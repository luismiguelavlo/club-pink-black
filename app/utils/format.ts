export function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatKm(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value) + ' km'
}

export function formatDateEs(iso: string, options?: Intl.DateTimeFormatOptions): string {
  const opts: Intl.DateTimeFormatOptions = options ?? { day: 'numeric', month: 'short', year: 'numeric' }
  return new Intl.DateTimeFormat('es-CO', opts).format(new Date(iso))
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat('es-CO', { month: 'short', year: '2-digit' }).format(d)
}
