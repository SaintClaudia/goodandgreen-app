import type { PaymentStatus } from '../types'

const STATUS_STYLES: Record<PaymentStatus, string> = {
  planned: 'bg-transparent text-[var(--muted)] border-[var(--border)]',
  paid: 'bg-[var(--panel-alt)] text-[var(--text)] border-[var(--border)]',
  cleared: 'bg-[var(--success-dark)] text-[var(--success)] border-[var(--success-dark)]',
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
    </span>
  )
}

interface StatusChipsProps {
  status: PaymentStatus
  onChange: (status: PaymentStatus) => void
}

/**
 * Interactive Paid / Cleared toggle chips. Neither active means "planned".
 * Returns a fragment (no wrapping element) so callers control the surrounding flex row.
 */
export function StatusChips({ status, onChange }: StatusChipsProps) {
  function toggle(target: PaymentStatus) {
    onChange(status === target ? 'planned' : target)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => toggle('paid')}
        aria-pressed={status === 'paid'}
        className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          status === 'paid'
            ? STATUS_STYLES.paid
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--text)] hover:text-[var(--text)]'
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
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--success)] hover:text-[var(--success)]'
        }`}
      >
        Cleared
      </button>
    </>
  )
}
