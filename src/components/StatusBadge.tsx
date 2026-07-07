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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

interface StatusChipsProps {
  status: PaymentStatus
  onChange: (status: PaymentStatus) => void
}

/**
 * Interactive Paid / Cleared toggle icon-buttons. Neither active means "planned".
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
        aria-label="Paid"
        title="Paid"
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          status === 'paid'
            ? STATUS_STYLES.paid
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
        }`}
      >
        <CheckIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => toggle('cleared')}
        aria-pressed={status === 'cleared'}
        aria-label="Cleared"
        title="Cleared"
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          status === 'cleared'
            ? STATUS_STYLES.cleared
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
        }`}
      >
        <CheckCircleIcon className="h-4 w-4" />
      </button>
    </>
  )
}
