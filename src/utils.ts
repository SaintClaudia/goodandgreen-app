import type { Bill, Fund } from './types'

export function generateId(): string {
  return crypto.randomUUID()
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/** Compact numeric date, e.g. "7.23" instead of "Jul 23". */
export function formatDateCompact(iso: string): string {
  if (!iso) return ''
  const [, month, day] = iso.split('-').map(Number)
  return `${month}.${day}`
}

export function todayISO(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Adds one month to an ISO date, clamping the day to the target month's length. */
export function addMonthClamped(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const firstOfNext = new Date(year, month, 1)
  const daysInNext = new Date(firstOfNext.getFullYear(), firstOfNext.getMonth() + 1, 0).getDate()
  firstOfNext.setDate(Math.min(day, daysInNext))
  const yyyy = firstOfNext.getFullYear()
  const mm = String(firstOfNext.getMonth() + 1).padStart(2, '0')
  const dd = String(firstOfNext.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export interface FundSummary {
  fundAmount: number
  plannedTotal: number
  paidOrClearedTotal: number
  remainingPlanned: number
  remainingCleared: number
}

export function summarizeFund(fund: Fund, bills: Bill[]): FundSummary {
  const assigned = bills.filter((b) => b.assignedFundId === fund.id)
  const plannedTotal = assigned.reduce((sum, b) => sum + b.amount, 0)
  const paidOrClearedTotal = assigned
    .filter((b) => b.status === 'paid' || b.status === 'cleared')
    .reduce((sum, b) => sum + b.amount, 0)
  const clearedTotal = assigned
    .filter((b) => b.status === 'cleared')
    .reduce((sum, b) => sum + b.amount, 0)

  return {
    fundAmount: fund.amount,
    plannedTotal,
    paidOrClearedTotal,
    remainingPlanned: fund.amount - plannedTotal,
    remainingCleared: fund.amount - clearedTotal,
  }
}
