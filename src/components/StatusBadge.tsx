import type { PaymentStatus } from '../types'

const STATUS_STYLES: Record<PaymentStatus, string> = {
  planned: 'bg-transparent text-[var(--muted)] border-[var(--border)]',
  paid: 'bg-[var(--accent-tint)] text-[var(--accent)] border-[var(--accent-dim)]',
  cleared: 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] border-[var(--accent-solid)]',
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  planned: '–',
  paid: 'Paid',
  cleared: 'Cleared',
}

/** Read-only badge for a bill's current status. Renders nothing for the neutral "planned" state. */
export function StatusChip({ status }: { status: PaymentStatus }) {
  if (status === 'planned') return null
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
      {status === 'cleared' ? ' ✓' : ''}
    </span>
  )
}

interface StatusChipsProps {
  status: PaymentStatus
  onChange: (status: PaymentStatus) => void
}

/** Interactive Paid / Cleared toggle chips for the bill edit form. Neither active means "planned". */
export function StatusChips({ status, onChange }: StatusChipsProps) {
  function toggle(target: PaymentStatus) {
    onChange(status === target ? 'planned' : target)
  }

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => toggle('paid')}
        aria-pressed={status === 'paid'}
        className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          status === 'paid'
            ? STATUS_STYLES.paid
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
        }`}
      >
        Paid
      </button>
      <button
        type="button"
        onClick={() => toggle('cleared')}
        aria-pressed={status === 'cleared'}
        className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          status === 'cleared'
            ? STATUS_STYLES.cleared
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
        }`}
      >
        Cleared ✓
      </button>
    </div>
  )
}
