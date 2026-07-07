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

interface StatusSelectProps {
  status: PaymentStatus
  onChange: (status: PaymentStatus) => void
  label: string
}

export function StatusSelect({ status, onChange, label }: StatusSelectProps) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as PaymentStatus)}
      aria-label={label}
      className={`w-full cursor-pointer rounded-full border px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${STATUS_STYLES[status]}`}
    >
      {(Object.keys(STATUS_LABELS) as PaymentStatus[]).map((key) => (
        <option key={key} value={key}>
          {STATUS_LABELS[key]}
          {key === 'cleared' ? ' ✓' : ''}
        </option>
      ))}
    </select>
  )
}
