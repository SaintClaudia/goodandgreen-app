import type { Bill, Paycheck, PaymentStatus } from '../types'
import { formatCurrency, formatDate, summarizePaycheck } from '../utils'
import { StatusSelect } from './StatusBadge'

interface PlanningTableProps {
  bills: Bill[]
  paychecks: Paycheck[]
  onAssignBill: (billId: string, paycheckId: string | null) => void
  onStatusChange: (billId: string, status: PaymentStatus) => void
  onEditBill: (bill: Bill) => void
  onEditPaycheck: (paycheck: Paycheck) => void
  onAddPaycheck: () => void
  onAddBill: () => void
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
}: PlanningTableProps) {
  const sortedPaychecks = [...paychecks].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="sticky left-0 z-10 min-w-[220px] border-r border-slate-200 bg-slate-50 px-4 py-3 text-left align-bottom font-semibold text-slate-700">
              Bills
            </th>
            {sortedPaychecks.map((paycheck) => (
              <th
                key={paycheck.id}
                className="min-w-[160px] px-4 py-3 text-left align-bottom font-semibold text-slate-700"
              >
                <button
                  type="button"
                  onClick={() => onEditPaycheck(paycheck)}
                  className="group flex w-full flex-col rounded-md px-1 py-1 text-left hover:bg-slate-100"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400 group-hover:text-slate-500">
                    {formatDate(paycheck.date)}
                  </span>
                  <span className="text-base font-semibold text-emerald-700">
                    {formatCurrency(paycheck.amount)}
                  </span>
                </button>
              </th>
            ))}
            <th className="min-w-[140px] px-4 py-3 align-bottom">
              <button
                type="button"
                onClick={onAddPaycheck}
                className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-emerald-400 hover:text-emerald-600"
              >
                + Add paycheck
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {bills.length === 0 && (
            <tr>
              <td
                colSpan={sortedPaychecks.length + 2}
                className="px-4 py-10 text-center text-sm text-slate-400"
              >
                No bills yet.{' '}
                <button type="button" onClick={onAddBill} className="font-medium text-emerald-600 hover:underline">
                  Add your first bill
                </button>
                .
              </td>
            </tr>
          )}
          {bills.map((bill) => {
            const assignedPaycheck = sortedPaychecks.find((p) => p.id === bill.assignedPaycheckId)
            const dueBeforePaycheck =
              assignedPaycheck && bill.dueDate && bill.dueDate < assignedPaycheck.date

            return (
              <tr
                key={bill.id}
                className={`border-b border-slate-100 last:border-b-0 ${
                  bill.status === 'cleared' ? 'bg-slate-50/60' : ''
                }`}
              >
                <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 align-top">
                  <div className={bill.status === 'cleared' ? 'opacity-60' : ''}>
                    <button
                      type="button"
                      onClick={() => onEditBill(bill)}
                      className="text-left font-medium text-slate-900 hover:text-emerald-700 hover:underline"
                    >
                      {bill.name}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-500">Due {formatDate(bill.dueDate)}</span>
                      {bill.autoWithdrawal && (
                        <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 border border-indigo-200">
                          Auto-pay
                        </span>
                      )}
                      {bill.recurringMonthly && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200">
                          Monthly
                        </span>
                      )}
                    </div>
                    {dueBeforePaycheck && (
                      <p className="mt-1 text-[11px] font-medium text-red-600">
                        ⚠ Due before this paycheck arrives
                      </p>
                    )}
                    {bill.notes && (
                      <p className="mt-1 truncate text-xs italic text-slate-400" title={bill.notes}>
                        {bill.notes}
                      </p>
                    )}
                  </div>
                  <select
                    value={bill.assignedPaycheckId ?? ''}
                    onChange={(e) => onAssignBill(bill.id, e.target.value || null)}
                    className="mt-2 w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {sortedPaychecks.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatDate(p.date)}
                      </option>
                    ))}
                  </select>
                </td>
                {sortedPaychecks.map((paycheck) => (
                  <td key={paycheck.id} className="px-4 py-3 align-top">
                    {bill.assignedPaycheckId === paycheck.id ? (
                      <div className={`space-y-1.5 ${bill.status === 'cleared' ? 'opacity-60' : ''}`}>
                        <div className="font-medium text-slate-800">{formatCurrency(bill.amount)}</div>
                        <StatusSelect
                          status={bill.status}
                          onChange={(status) => onStatusChange(bill.id, status)}
                        />
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                ))}
                <td />
              </tr>
            )
          })}
        </tbody>
        {sortedPaychecks.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 px-4 py-3 align-top font-semibold text-slate-700">
                Summary
              </td>
              {sortedPaychecks.map((paycheck) => {
                const summary = summarizePaycheck(paycheck, bills)
                const isNegative = summary.remainingCleared < 0 || summary.remainingPlanned < 0
                return (
                  <td key={paycheck.id} className="px-4 py-3 align-top text-xs text-slate-600">
                    <dl className="space-y-1">
                      <div className="flex justify-between gap-2">
                        <dt>Paycheck</dt>
                        <dd className="font-medium text-slate-800">
                          {formatCurrency(summary.paycheckAmount)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Planned bills</dt>
                        <dd className="font-medium text-slate-800">
                          −{formatCurrency(summary.plannedTotal)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Paid / cleared</dt>
                        <dd className="font-medium text-emerald-700">
                          {formatCurrency(summary.paidOrClearedTotal)}
                        </dd>
                      </div>
                      <div className="mt-1 flex justify-between gap-2 border-t border-slate-200 pt-1">
                        <dt className="font-medium text-slate-700">Remaining (planned)</dt>
                        <dd className={`font-semibold ${isNegative ? 'text-red-600' : 'text-slate-900'}`}>
                          {formatCurrency(summary.remainingPlanned)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="font-medium text-slate-700">Remaining (cleared)</dt>
                        <dd className={`font-semibold ${isNegative ? 'text-red-600' : 'text-emerald-700'}`}>
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
