import { useState } from 'react'
import type { Expense } from '../types'
import { formatCurrency } from '../utils'

interface ExpenseListProps {
  fundId: string
  expenses: Expense[]
  onAdd: (fundId: string, label: string, amount: number) => void
  onDelete: (expenseId: string) => void
}

export function ExpenseList({ fundId, expenses, onAdd, onDelete }: ExpenseListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')

  function commit() {
    const trimmedLabel = label.trim()
    const numericAmount = Number(amount)
    if (trimmedLabel && amount && !Number.isNaN(numericAmount) && numericAmount > 0) {
      onAdd(fundId, trimmedLabel, numericAmount)
      setLabel('')
      setAmount('')
      setIsAdding(false)
    }
  }

  function cancel() {
    setLabel('')
    setAmount('')
    setIsAdding(false)
  }

  return (
    <div className="mt-2 text-right">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Spending</div>
      {expenses.length > 0 && (
        <ul className="mt-1 space-y-1">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center justify-end gap-1.5 text-xs">
              <span className="truncate text-[var(--muted)]">{expense.label}</span>
              <span className="font-medium text-[var(--text)]">{formatCurrency(expense.amount)}</span>
              <button
                type="button"
                onClick={() => onDelete(expense.id)}
                aria-label={`Remove ${expense.label}`}
                className="flex-shrink-0 text-[var(--muted)] hover:text-[var(--danger)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {isAdding ? (
        <div className="mt-1 flex items-center justify-end gap-1">
          <input
            autoFocus
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                cancel()
              }
            }}
            placeholder="Label"
            className="w-0 min-w-0 flex-1 rounded-[5px] border border-[var(--accent)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text)] focus:outline-none"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                cancel()
              }
            }}
            placeholder="0.00"
            className="w-16 flex-shrink-0 rounded-[5px] border border-[var(--accent)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text)] focus:outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="mt-1 rounded-[5px] border border-dashed border-[var(--border)] px-2 py-1 text-[11px] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          + add expense
        </button>
      )}
    </div>
  )
}
