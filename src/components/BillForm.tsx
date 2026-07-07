import { useState } from 'react'
import type { Bill } from '../types'
import { Modal } from './Modal'

export type BillDraft = Pick<
  Bill,
  | 'name'
  | 'amount'
  | 'dueDate'
  | 'autoWithdrawal'
  | 'recurringMonthly'
  | 'notes'
  | 'remainingBalance'
>

interface BillFormProps {
  initial?: Bill
  onSave: (bill: BillDraft) => void
  onClose: () => void
  onDelete?: () => void
}

export function BillForm({ initial, onSave, onClose, onDelete }: BillFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [autoWithdrawal, setAutoWithdrawal] = useState(initial?.autoWithdrawal ?? false)
  const [recurringMonthly, setRecurringMonthly] = useState(initial?.recurringMonthly ?? true)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [hasBalance, setHasBalance] = useState(initial?.remainingBalance != null)
  const [remainingBalance, setRemainingBalance] = useState(
    initial?.remainingBalance != null ? String(initial.remainingBalance) : '',
  )
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numericAmount = Number(amount)
    if (!name.trim()) {
      setError('Please enter a bill name.')
      return
    }
    if (!dueDate) {
      setError('Please choose a due date.')
      return
    }
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    const numericBalance = Number(remainingBalance)
    if (hasBalance && (!remainingBalance || Number.isNaN(numericBalance) || numericBalance < 0)) {
      setError('Please enter a valid remaining balance.')
      return
    }
    onSave({
      name: name.trim(),
      amount: numericAmount,
      dueDate,
      autoWithdrawal,
      recurringMonthly,
      notes: notes.trim(),
      remainingBalance: hasBalance ? numericBalance : null,
    })
    onClose()
  }

  return (
    <Modal title={initial ? 'Edit bill' : 'Add bill'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--muted)]">Bill name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rent, Netflix, Car insurance"
            className="mt-1 w-full rounded-[5px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--muted)]">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-[5px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--muted)]">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-[5px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none dark:[color-scheme:dark]"
            />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={autoWithdrawal}
              onChange={(e) => setAutoWithdrawal(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Auto-withdrawal
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={recurringMonthly}
              onChange={(e) => setRecurringMonthly(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Recurring monthly
          </label>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={hasBalance}
              onChange={(e) => setHasBalance(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Track remaining balance (loan, credit card, etc.)
          </label>
          {hasBalance && (
            <input
              type="number"
              step="0.01"
              min="0"
              value={remainingBalance}
              onChange={(e) => setRemainingBalance(e.target.value)}
              placeholder="Total balance still owed"
              className="mt-2 w-full rounded-[5px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
            />
          )}
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--muted)]">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional"
            className="mt-1 w-full rounded-[5px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <div className="flex items-center justify-between pt-2">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm text-[var(--danger)] hover:underline"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[5px] border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-1.5 text-sm text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-[5px] border border-[var(--accent)] bg-[var(--accent-dim)] px-3 py-1.5 text-sm text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent)]"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
