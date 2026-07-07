import { useEffect, useRef, useState } from 'react'
import type { Bill, Paycheck, PaymentStatus } from '../types'
import { formatCurrency, formatDate, summarizePaycheck } from '../utils'
import { StatusSelect } from './StatusBadge'

const ASSIGN_FLASH_MS = 1800

interface PlanningTableProps {
  bills: Bill[]
  paychecks: Paycheck[]
  onAssignBill: (billId: string, paycheckId: string | null) => void
  onStatusChange: (billId: string, status: PaymentStatus) => void
  onEditBill: (bill: Bill) => void
  onEditPaycheck: (paycheck: Paycheck) => void
  onAddPaycheck: () => void
  onAddBill: () => void
  onReorderBills: (draggedId: string, targetId: string) => void
}

export function PlanningTable({
  bills,
  paychecks,
  onAssignBill,
  onStatusChange,
  onEditBill,
  onEditPaycheck,
  onAddPaycheck,
  onAddBill,
  onReorderBills,
}: PlanningTableProps) {
  const sortedPaychecks = [...paychecks].sort((a, b) => a.date.localeCompare(b.date))
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [justAssigned, setJustAssigned] = useState<Set<string>>(new Set())
  const flashTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const timeouts = flashTimeouts.current
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  function flashAssigned(key: string) {
    setJustAssigned((prev) => new Set(prev).add(key))
    const existing = flashTimeouts.current.get(key)
    if (existing) clearTimeout(existing)
    flashTimeouts.current.set(
      key,
      setTimeout(() => {
        setJustAssigned((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
        flashTimeouts.current.delete(key)
      }, ASSIGN_FLASH_MS),
    )
  }

  function moveBill(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= bills.length) return
    onReorderBills(bills[index].id, bills[targetIndex].id)
  }

  return (
    <div className="overflow-x-auto rounded-[6px] border border-[var(--border)] bg-[var(--panel)]">
      <table className="w-full min-w-max border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--panel-alt)]">
            <th className="sticky left-0 z-10 min-w-[220px] border-r border-[var(--border)] bg-[var(--panel-alt)] px-4 py-3 text-left align-bottom">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Bills
                </span>
                <button
                  type="button"
                  onClick={onAddBill}
                  className="rounded-[5px] border border-dashed border-[var(--border)] px-2 py-1 text-[10px] normal-case text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  + add bill
                </button>
              </div>
            </th>
            {sortedPaychecks.map((paycheck) => (
              <th key={paycheck.id} className="min-w-[160px] px-3 py-3 text-left align-bottom">
                <button
                  type="button"
                  onClick={() => onEditPaycheck(paycheck)}
                  className="flex w-full flex-col rounded-[6px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-left transition-colors hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {formatDate(paycheck.date)}
                  </span>
                  <span className="text-[20px] font-semibold text-[var(--accent)]">
                    {formatCurrency(paycheck.amount)}
                  </span>
                </button>
              </th>
            ))}
            <th className="min-w-[140px] px-4 py-3 align-bottom">
              <button
                type="button"
                onClick={onAddPaycheck}
                className="rounded-[5px] border border-dashed border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                + add funds
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {bills.length === 0 && (
            <tr>
              <td
                colSpan={sortedPaychecks.length + 2}
                className="px-4 py-10 text-center text-[var(--muted)]"
              >
                No bills yet.{' '}
                <button
                  type="button"
                  onClick={onAddBill}
                  className="text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Add your first bill
                </button>
                .
              </td>
            </tr>
          )}
          {bills.map((bill, index) => {
            const assignedPaycheck = sortedPaychecks.find((p) => p.id === bill.assignedPaycheckId)
            const dueBeforePaycheck =
              assignedPaycheck && bill.dueDate && bill.dueDate < assignedPaycheck.date

            return (
              <tr
                key={bill.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverId(bill.id)
                }}
                onDragLeave={() => setDragOverId((current) => (current === bill.id ? null : current))}
                onDrop={(e) => {
                  e.preventDefault()
                  const draggedId = e.dataTransfer.getData('text/plain')
                  setDragOverId(null)
                  if (draggedId) onReorderBills(draggedId, bill.id)
                }}
                className={`border-b border-[var(--border)] last:border-b-0 ${
                  bill.status === 'cleared' ? 'bg-[var(--panel-alt)]/40' : ''
                } ${dragOverId === bill.id ? 'border-t-2 border-t-[var(--accent)]' : ''}`}
              >
                <td className="sticky left-0 z-10 border-r border-[var(--border)] bg-[var(--panel)] px-4 py-3 align-top">
                  <div className="flex h-full items-center gap-2">
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', bill.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => setDragOverId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          moveBill(index, -1)
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          moveBill(index, 1)
                        }
                      }}
                      aria-label={`Reorder ${bill.name}. Drag, or press arrow up or down, to move.`}
                      className="flex-shrink-0 cursor-pointer select-none border-none bg-transparent p-0 leading-none text-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                    >
                      ⠿
                    </button>
                    <div className={`min-w-0 flex-1 self-start ${bill.status === 'cleared' ? 'opacity-60' : ''}`}>
                      <button
                        type="button"
                        onClick={() => onEditBill(bill)}
                        className="text-left text-[13.5px] font-semibold text-[var(--text)] hover:text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      >
                        {bill.name}
                      </button>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-[var(--muted)]">Due {formatDate(bill.dueDate)}</span>
                        {bill.autoWithdrawal && (
                          <span className="rounded-full border border-[var(--accent-dim)] px-1.5 py-0.5 text-[10px] text-[var(--accent)]">
                            Auto-pay
                          </span>
                        )}
                        {bill.recurringMonthly && (
                          <span className="rounded-full border border-[var(--border)] px-1.5 py-0.5 text-[9.5px] text-[var(--muted)]">
                            Monthly
                          </span>
                        )}
                      </div>
                      {dueBeforePaycheck && (
                        <p className="mt-1 text-[11px] font-medium text-[var(--danger)]">
                          ⚠ Due before this paycheck arrives
                        </p>
                      )}
                      {bill.remainingBalance != null && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Balance owed:{' '}
                          <span className="font-medium text-[var(--text)]">
                            {formatCurrency(bill.remainingBalance)}
                          </span>
                        </p>
                      )}
                      {bill.notes && (
                        <p className="mt-1 truncate text-xs italic text-[var(--muted)]" title={bill.notes}>
                          {bill.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                {sortedPaychecks.map((paycheck) => {
                  const isAssigned = bill.assignedPaycheckId === paycheck.id
                  const flashKey = `${bill.id}:${paycheck.id}`
                  const isFlashing = justAssigned.has(flashKey)
                  const toggle = (
                    <button
                      type="button"
                      onClick={() => {
                        const nextAssigned = !isAssigned
                        onAssignBill(bill.id, nextAssigned ? paycheck.id : null)
                        if (nextAssigned) flashAssigned(flashKey)
                      }}
                      aria-label={isAssigned ? 'Unassign from this paycheck' : 'Assign to this paycheck'}
                      aria-pressed={isAssigned}
                      className={`h-4 w-4 flex-shrink-0 rounded border transition-colors duration-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                        isAssigned
                          ? isFlashing
                            ? 'border-[var(--accent)] bg-[var(--accent)]'
                            : 'border-[var(--border)] bg-[var(--neutral-fill)]'
                          : 'border-dashed border-[var(--border)] bg-transparent hover:border-[var(--accent)]'
                      }`}
                    />
                  )
                  return (
                    <td key={paycheck.id} className="px-3 py-3 align-top">
                      {isAssigned ? (
                        <div className={`space-y-1.5 ${bill.status === 'cleared' ? 'opacity-60' : ''}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[var(--text)]">{formatCurrency(bill.amount)}</span>
                            {toggle}
                          </div>
                          <StatusSelect
                            status={bill.status}
                            onChange={(status) => onStatusChange(bill.id, status)}
                            label={`${bill.name} status for ${formatDate(paycheck.date)} paycheck`}
                          />
                        </div>
                      ) : (
                        <div className="flex justify-end">{toggle}</div>
                      )}
                    </td>
                  )
                })}
                <td />
              </tr>
            )
          })}
        </tbody>
        {sortedPaychecks.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-[var(--border)] bg-[var(--panel-alt)]">
              <td className="sticky left-0 z-10 border-r border-[var(--border)] bg-[var(--panel-alt)] px-4 py-3 align-top text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Summary
              </td>
              {sortedPaychecks.map((paycheck) => {
                const summary = summarizePaycheck(paycheck, bills)
                const isNegative = summary.remainingCleared < 0 || summary.remainingPlanned < 0
                return (
                  <td key={paycheck.id} className="px-3 py-3 align-top text-xs text-[var(--muted)]">
                    <dl className="space-y-1">
                      <div className="flex justify-between gap-2">
                        <dt>Paycheck</dt>
                        <dd className="font-medium text-[var(--text)]">
                          {formatCurrency(summary.paycheckAmount)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Planned bills</dt>
                        <dd className="font-medium text-[var(--text)]">
                          −{formatCurrency(summary.plannedTotal)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Paid / cleared</dt>
                        <dd className="font-medium text-[var(--accent)]">
                          {formatCurrency(summary.paidOrClearedTotal)}
                        </dd>
                      </div>
                      <div className="mt-1 flex justify-between gap-2 border-t border-[var(--border)] pt-1">
                        <dt className="font-medium text-[var(--muted)]">Remaining (planned)</dt>
                        <dd
                          className={`font-semibold ${
                            isNegative ? 'text-[var(--danger)]' : 'text-[var(--text)]'
                          }`}
                        >
                          {formatCurrency(summary.remainingPlanned)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="font-medium text-[var(--muted)]">Remaining (cleared)</dt>
                        <dd
                          className={`font-semibold ${
                            isNegative ? 'text-[var(--danger)]' : 'text-[var(--accent)]'
                          }`}
                        >
                          {formatCurrency(summary.remainingCleared)}
                        </dd>
                      </div>
                    </dl>
                  </td>
                )
              })}
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
