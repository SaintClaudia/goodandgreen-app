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
    weekday: 'short',
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
