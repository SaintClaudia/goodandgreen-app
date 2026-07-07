import type { PaymentStatus } from '../types'

const STATUS_STYLES: Record<PaymentStatus, string> = {
  planned: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  paid: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  cleared: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  planned: 'Planned',
  paid: 'Paid',
  cleared: 'Cleared',
}

interface StatusSelectProps {
  status: PaymentStatus
  onChange: (status: PaymentStatus) => void
}

export function StatusSelect({ status, onChange }: StatusSelectProps) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as PaymentStatus)}
      className={`w-full cursor-pointer rounded-md border px-1.5 py-0.5 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ${STATUS_STYLES[status]}`}
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
