import { useEffect, useRef, useState } from 'react'
import type { Assignment, Bill, Expense, Fund } from '../types'
import { formatCurrency, formatDate, formatDateCompact, summarizeFund } from '../utils'
import { useLocalStorage } from '../useLocalStorage'
import { StatusChip } from './StatusBadge'
import { ExpenseList } from './ExpenseList'

const ASSIGN_FLASH_MS = 1800
const MIN_BILLS_COLUMN_WIDTH = 180
const MAX_BILLS_COLUMN_WIDTH = 560

interface PlanningTableProps {
  bills: Bill[]
  funds: Fund[]
  assignments: Assignment[]
  expenses: Expense[]
  onAssignBill: (billId: string, fundId: string) => void
  onUnassignBill: (billId: string, fundId: string) => void
  onEditBill: (bill: Bill) => void
  onOpenBillStatus: (bill: Bill, assignment: Assignment) => void
  onEditFund: (fund: Fund) => void
  onAddFund: () => void
  onAddBill: () => void
  onReorderBills: (draggedId: string, targetId: string) => void
  onAddExpense: (fundId: string, label: string, amount: number) => void
  onDeleteExpense: (expenseId: string) => void
}

function assignmentKey(billId: string, fundId: string) {
  return `${billId}:${fundId}`
}

export function PlanningTable({
  bills,
  funds,
  assignments,
  expenses,
  onAssignBill,
  onUnassignBill,
  onEditBill,
  onOpenBillStatus,
  onEditFund,
  onAddFund,
  onAddBill,
  onReorderBills,
  onAddExpense,
  onDeleteExpense,
}: PlanningTableProps) {
  const sortedFunds = [...funds].sort((a, b) => a.date.localeCompare(b.date))
  const assignmentsByKey = new Map(assignments.map((a) => [assignmentKey(a.billId, a.fundId), a]))
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [justAssigned, setJustAssigned] = useState<Set<string>>(new Set())
  const flashTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [billsColumnWidth, setBillsColumnWidth] = useLocalStorage('billsColumnWidth', 260)
  const resizeState = useRef<{ startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    const timeouts = flashTimeouts.current
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handleColumnResizeMove)
      window.removeEventListener('pointerup', handleColumnResizeEnd)
    }
  }, [])

  function handleColumnResizeStart(e: React.PointerEvent) {
    e.preventDefault()
    resizeState.current = { startX: e.clientX, startWidth: billsColumnWidth }
    window.addEventListener('pointermove', handleColumnResizeMove)
    window.addEventListener('pointerup', handleColumnResizeEnd)
  }

  function handleColumnResizeMove(e: PointerEvent) {
    if (!resizeState.current) return
    const delta = e.clientX - resizeState.current.startX
    const next = Math.min(
      MAX_BILLS_COLUMN_WIDTH,
      Math.max(MIN_BILLS_COLUMN_WIDTH, resizeState.current.startWidth + delta),
    )
    setBillsColumnWidth(next)
  }

  function handleColumnResizeEnd() {
    resizeState.current = null
    window.removeEventListener('pointermove', handleColumnResizeMove)
    window.removeEventListener('pointerup', handleColumnResizeEnd)
  }

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
    <div
      className="overflow-x-auto rounded-[6px] border border-[var(--border)] bg-[var(--panel)]"
      style={{ '--bills-col-width': `${billsColumnWidth}px` } as React.CSSProperties}
    >
      <table className="w-full min-w-max border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--panel-alt)]">
            <th className="sticky left-0 z-10 w-[var(--bills-col-width)] min-w-[180px] max-w-[560px] border-r border-[var(--border)] bg-[var(--panel-alt)] px-4 py-3 text-left align-bottom">
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
              <div
                onPointerDown={handleColumnResizeStart}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize bills column"
                className="absolute inset-y-0 right-0 z-20 w-2 cursor-col-resize touch-none select-none hover:bg-[var(--accent)]"
              />
            </th>
            {sortedFunds.map((fund) => (
              <th key={fund.id} className="min-w-[160px] px-3 py-3 text-left align-bottom">
                <button
                  type="button"
                  onClick={() => onEditFund(fund)}
                  className="flex w-full flex-col items-end rounded-[6px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-right transition-colors hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {formatDate(fund.date)}
                  </span>
                  <span className="text-[20px] font-semibold text-[var(--accent)]">
                    {formatCurrency(fund.amount)}
                  </span>
                </button>
              </th>
            ))}
            <th className="min-w-[140px] px-4 py-3 align-bottom">
              <button
                type="button"
                onClick={onAddFund}
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
                colSpan={sortedFunds.length + 2}
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
                  dragOverId === bill.id ? 'border-t-2 border-t-[var(--accent)]' : ''
                }`}
              >
                <td className="sticky left-0 z-10 w-[var(--bills-col-width)] min-w-[180px] max-w-[560px] overflow-hidden border-r border-[var(--border)] bg-[var(--panel)] px-4 py-3 align-top">
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
                      className="flex-shrink-0 cursor-grab select-none border-none bg-transparent p-0 leading-none text-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:cursor-grabbing"
                    >
                      ⠿
                    </button>
                    <div className="@container min-w-0 flex-1 self-start">
                      <div className="flex flex-col items-start gap-0.5 @[220px]:flex-row @[220px]:items-baseline @[220px]:justify-between @[220px]:gap-2">
                        <button
                          type="button"
                          onClick={() => onEditBill(bill)}
                          className="text-left text-[13.5px] font-semibold text-[var(--text)] hover:text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                        >
                          {bill.name}
                        </button>
                        {bill.autoWithdrawal && (
                          <span className="flex-shrink-0 rounded-full border border-[var(--accent-dim)] px-1.5 py-0.5 text-[10px] text-[var(--accent)]">
                            Auto-pay
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-col items-start gap-0.5 @[260px]:flex-row @[260px]:items-baseline @[260px]:justify-between @[260px]:gap-2">
                        {bill.remainingBalance != null && (
                          <span className="text-xs text-[var(--muted)]">
                            Balance owed:{' '}
                            <span className="font-medium text-[var(--text)]">
                              {formatCurrency(bill.remainingBalance)}
                            </span>
                          </span>
                        )}
                        <span className="flex-shrink-0 text-xs text-[var(--muted)]">Due {formatDate(bill.dueDate)}</span>
                      </div>
                      {bill.notes && (
                        <p className="mt-1 truncate text-xs italic text-[var(--muted)]" title={bill.notes}>
                          {bill.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                {sortedFunds.map((fund) => {
                  const assignment = assignmentsByKey.get(assignmentKey(bill.id, fund.id))
                  const isAssigned = !!assignment
                  const flashKey = assignmentKey(bill.id, fund.id)
                  const isFlashing = justAssigned.has(flashKey)

                  function toggleAssignment() {
                    if (isAssigned) {
                      onUnassignBill(bill.id, fund.id)
                    } else {
                      onAssignBill(bill.id, fund.id)
                      flashAssigned(flashKey)
                    }
                  }

                  return (
                    <td key={fund.id} className="relative p-0 align-top">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={toggleAssignment}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggleAssignment()
                          }
                        }}
                        aria-pressed={isAssigned}
                        aria-label={
                          isAssigned ? `Unassign ${bill.name} from these funds` : `Assign ${bill.name} to these funds`
                        }
                        className={`absolute inset-1 min-h-[52px] cursor-pointer rounded-[6px] border border-dashed px-3 py-3 text-right transition-colors duration-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
                          isAssigned && isFlashing
                            ? 'border-[var(--accent)] bg-[var(--accent)]'
                            : 'border-transparent bg-transparent hover:border-[var(--border)]'
                        }`}
                      >
                        {assignment && (
                          <div
                            className={`space-y-1 ${assignment.status === 'cleared' ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span>
                                <StatusChip status={assignment.status} />
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onOpenBillStatus(bill, assignment)
                                }}
                                className={`font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                                  isFlashing ? 'text-white' : 'text-[var(--text)] hover:text-[var(--accent)]'
                                }`}
                              >
                                {formatCurrency(bill.amount)}
                              </button>
                            </div>
                            {assignment.plannedPaymentDate && (
                              <div className="text-[10px] text-[var(--muted)]">
                                pay {formatDateCompact(assignment.plannedPaymentDate)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )
                })}
                <td />
              </tr>
            )
          })}
        </tbody>
        {sortedFunds.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-[var(--border)] bg-[var(--panel-alt)]">
              <td className="sticky left-0 z-10 w-[var(--bills-col-width)] min-w-[180px] max-w-[560px] border-r border-[var(--border)] bg-[var(--panel-alt)] px-4 py-3 align-top text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Summary
              </td>
              {sortedFunds.map((fund) => {
                const summary = summarizeFund(fund, bills, assignments, expenses)
                const fundExpenses = expenses.filter((e) => e.fundId === fund.id)
                return (
                  <td key={fund.id} className="px-3 py-3 align-top text-xs text-[var(--muted)]">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Remaining</div>
                      <div
                        className={`text-[18px] font-semibold ${
                          summary.remainingPlanned < 0 ? 'text-[var(--danger)]' : 'text-[var(--text)]'
                        }`}
                      >
                        {formatCurrency(summary.remainingPlanned)}
                      </div>
                    </div>
                    <ExpenseList
                      fundId={fund.id}
                      expenses={fundExpenses}
                      onAdd={onAddExpense}
                      onDelete={onDeleteExpense}
                    />
                    <details className="group mt-2">
                      <summary className="flex cursor-pointer list-none items-center justify-end gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--accent)] [&::-webkit-details-marker]:hidden">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3 w-3 flex-shrink-0 transition-transform group-open:rotate-90"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Details
                      </summary>
                      <dl className="mt-1.5 space-y-1">
                        <div className="flex justify-between gap-2">
                          <dt>Funds</dt>
                          <dd className="font-medium text-[var(--text)]">
                            {formatCurrency(summary.fundAmount)}
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
                        <div className="flex justify-between gap-2">
                          <dt>Spending</dt>
                          <dd className="font-medium text-[var(--text)]">
                            −{formatCurrency(summary.spendingTotal)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2 border-t border-[var(--border)] pt-1">
                          <dt className="font-medium text-[var(--muted)]">Remaining (cleared)</dt>
                          <dd
                            className={`font-semibold ${
                              summary.remainingCleared < 0 ? 'text-[var(--danger)]' : 'text-[var(--accent)]'
                            }`}
                          >
                            {formatCurrency(summary.remainingCleared)}
                          </dd>
                        </div>
                      </dl>
                    </details>
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
