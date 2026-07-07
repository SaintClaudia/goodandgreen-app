export type PaymentStatus = 'planned' | 'paid' | 'cleared'

export interface Fund {
  id: string
  date: string // ISO date string, e.g. 2026-07-15
  amount: number
}

export interface Expense {
  id: string
  fundId: string
  label: string
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
  remainingBalance: number | null // e.g. payoff balance on a loan or credit card
}

/** One placement of a bill onto a fund - its own status/notes/tags, independent of any other fund the same bill is placed on. */
export interface Assignment {
  id: string
  billId: string
  fundId: string
  status: PaymentStatus
  notes: string
  customChips: string[] // freeform tags (e.g. "Disputed"), independent of status
  plannedPaymentDate: string | null // ISO date string - when you actually intend to pay this occurrence
}
