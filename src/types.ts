export type PaymentStatus = 'planned' | 'paid' | 'cleared'

export interface Paycheck {
  id: string
  date: string // ISO date string, e.g. 2026-07-15
  amount: number
}

export interface Bill {
  id: string
  name: string
  amount: number
  dueDate: string // ISO date string
  autoWithdrawal: boolean
  recurringMonthly: boolean
  notes: string
  assignedPaycheckId: string | null
  status: PaymentStatus
  remainingBalance: number | null // e.g. payoff balance on a loan or credit card
  plannedPaymentDate: string | null // ISO date string - when you actually intend to pay it
  customChips: string[] // freeform tags (e.g. "Disputed"), independent of status
}
