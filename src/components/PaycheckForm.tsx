import { useState } from 'react'
import type { Paycheck } from '../types'
import { Modal } from './Modal'

interface PaycheckFormProps {
  initial?: Paycheck
  onSave: (paycheck: Pick<Paycheck, 'date' | 'amount'>) => void
  onClose: () => void
  onDelete?: () => void
}

export function PaycheckForm({ initial, onSave, onClose, onDelete }: PaycheckFormProps) {
  const [date, setDate] = useState(initial?.date ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numericAmount = Number(amount)
    if (!date) {
      setError('Please choose a date.')
      return
    }
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    onSave({ date, amount: numericAmount })
    onClose()
  }

  return (
    <Modal title={initial ? 'Edit paycheck' : 'Add paycheck'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--muted)]">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-[5px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none dark:[color-scheme:dark]"
          />
        </div>
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
