import { useState } from 'react'
import type { Bill, PaymentStatus } from '../types'
import { Modal } from './Modal'
import { StatusChips } from './StatusBadge'
import { formatCurrency, formatDate } from '../utils'

export interface BillStatusUpdate {
  status: PaymentStatus
  customChips: string[]
  notes: string
}

interface BillStatusModalProps {
  bill: Bill
  customChipOptions: string[]
  onCreateCustomChip: (label: string) => void
  onSave: (billId: string, update: BillStatusUpdate) => void
  onClose: () => void
}

export function BillStatusModal({
  bill,
  customChipOptions,
  onCreateCustomChip,
  onSave,
  onClose,
}: BillStatusModalProps) {
  const [status, setStatus] = useState(bill.status)
  const [customChips, setCustomChips] = useState(bill.customChips ?? [])
  const [notes, setNotes] = useState(bill.notes)
  const [isAddingChip, setIsAddingChip] = useState(false)
  const [newChipText, setNewChipText] = useState('')

  function toggleChip(label: string) {
    setCustomChips((prev) => (prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]))
  }

  function commitNewChip() {
    const label = newChipText.trim()
    if (label) {
      if (!customChipOptions.some((opt) => opt.toLowerCase() === label.toLowerCase())) {
        onCreateCustomChip(label)
      }
      setCustomChips((prev) => (prev.includes(label) ? prev : [...prev, label]))
    }
    setNewChipText('')
    setIsAddingChip(false)
  }

  function handleSave() {
    onSave(bill.id, { status, customChips, notes: notes.trim() })
    onClose()
  }

  return (
    <Modal title={bill.name} onClose={onClose}>
      <div className="space-y-4">
        <dl className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <dt className="uppercase tracking-wider text-[var(--muted)]">Bill</dt>
            <dd className="mt-0.5 truncate font-medium text-[var(--text)]">{bill.name}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-[var(--muted)]">Amount</dt>
            <dd className="mt-0.5 font-medium text-[var(--text)]">{formatCurrency(bill.amount)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-[var(--muted)]">Due</dt>
            <dd className="mt-0.5 font-medium text-[var(--text)]">{formatDate(bill.dueDate)}</dd>
          </div>
        </dl>

        <div>
          <span className="block text-[11px] uppercase tracking-wider text-[var(--muted)]">Status</span>
          <div className="mt-1.5">
            <StatusChips status={status} onChange={setStatus} />
          </div>
        </div>

        <div>
          <span className="block text-[11px] uppercase tracking-wider text-[var(--muted)]">Tags</span>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {customChipOptions.map((option) => {
              const active = customChips.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleChip(option)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                    active
                      ? 'border-[var(--accent-dim)] bg-[var(--accent-tint)] text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  }`}
                >
                  {option}
                </button>
              )
            })}
            {isAddingChip ? (
              <input
                autoFocus
                type="text"
                value={newChipText}
                onChange={(e) => setNewChipText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitNewChip()
                  } else if (e.key === 'Escape') {
                    setNewChipText('')
                    setIsAddingChip(false)
                  }
                }}
                onBlur={commitNewChip}
                placeholder="Label"
                className="w-24 rounded-full border border-[var(--accent)] bg-[var(--bg)] px-3 py-1 text-xs text-[var(--text)] focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingChip(true)}
                className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                + add chip
              </button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="bill-status-notes" className="block text-[11px] uppercase tracking-wider text-[var(--muted)]">
            Notes
          </label>
          <textarea
            id="bill-status-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional"
            className="mt-1 w-full rounded-[5px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[5px] border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-1.5 text-sm text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-[5px] border border-[var(--accent)] bg-[var(--accent-solid)] px-3 py-1.5 text-sm text-[var(--accent-contrast)] transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
