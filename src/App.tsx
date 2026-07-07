import { useState } from 'react'
import type { Bill, Paycheck, PaymentStatus } from './types'
import { useLocalStorage } from './useLocalStorage'
import { useTheme } from './useTheme'
import { generateId, sortByDueDate } from './utils'
import { PlanningTable } from './components/PlanningTable'
import { PaycheckForm } from './components/PaycheckForm'
import { BillForm, type BillDraft } from './components/BillForm'
import { ThemeToggle } from './components/ThemeToggle'

type PaycheckModalState = { mode: 'add' } | { mode: 'edit'; paycheck: Paycheck } | null
type BillModalState = { mode: 'add' } | { mode: 'edit'; bill: Bill } | null

function App() {
  const [paychecks, setPaychecks] = useLocalStorage<Paycheck[]>('paychecks', [])
  const [bills, setBills] = useLocalStorage<Bill[]>('bills', [])
  const [paycheckModal, setPaycheckModal] = useState<PaycheckModalState>(null)
  const [billModal, setBillModal] = useState<BillModalState>(null)
  const { theme, toggleTheme } = useTheme()

  function handleSavePaycheck(draft: Pick<Paycheck, 'date' | 'amount'>) {
    if (paycheckModal?.mode === 'edit') {
      const id = paycheckModal.paycheck.id
      setPaychecks((prev) => prev.map((p) => (p.id === id ? { ...p, ...draft } : p)))
    } else {
      setPaychecks((prev) => [...prev, { id: generateId(), ...draft }])
    }
  }

  function handleDeletePaycheck() {
    if (paycheckModal?.mode !== 'edit') return
    const id = paycheckModal.paycheck.id
    setPaychecks((prev) => prev.filter((p) => p.id !== id))
    setBills((prev) =>
      prev.map((b) => (b.assignedPaycheckId === id ? { ...b, assignedPaycheckId: null } : b)),
    )
    setPaycheckModal(null)
  }

  function handleSaveBill(draft: BillDraft) {
    if (billModal?.mode === 'edit') {
      const id = billModal.bill.id
      setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...draft } : b)))
    } else {
      setBills((prev) => [
        ...prev,
        {
          id: generateId(),
          assignedPaycheckId: null,
          status: 'planned',
          ...draft,
        },
      ])
    }
  }

  function handleDeleteBill() {
    if (billModal?.mode !== 'edit') return
    const id = billModal.bill.id
    setBills((prev) => prev.filter((b) => b.id !== id))
    setBillModal(null)
  }

  function handleAssignBill(billId: string, paycheckId: string | null) {
    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, assignedPaycheckId: paycheckId } : b)),
    )
  }

  function handleStatusChange(billId: string, status: PaymentStatus) {
    setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, status } : b)))
  }

  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <header className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#0bf81e]" />
          <span className="text-[13px] text-[var(--text)]">paycheck planner</span>
          <div className="ml-auto">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <div className="mb-3.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBillModal({ mode: 'add' })}
            className="rounded-[5px] border border-[var(--accent)] bg-[var(--accent-dim)] px-2.5 py-1.5 text-xs text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent)]"
          >
            + add bill
          </button>
          <button
            type="button"
            onClick={() => setPaycheckModal({ mode: 'add' })}
            className="rounded-[5px] border border-[var(--border)] bg-[var(--panel-alt)] px-2.5 py-1.5 font-mono text-xs text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            + add paycheck
          </button>
        </div>

        <PlanningTable
          bills={sortByDueDate(bills)}
          paychecks={paychecks}
          onAssignBill={handleAssignBill}
          onStatusChange={handleStatusChange}
          onEditBill={(bill) => setBillModal({ mode: 'edit', bill })}
          onEditPaycheck={(paycheck) => setPaycheckModal({ mode: 'edit', paycheck })}
          onAddPaycheck={() => setPaycheckModal({ mode: 'add' })}
          onAddBill={() => setBillModal({ mode: 'add' })}
        />
      </div>

      {paycheckModal && (
        <PaycheckForm
          initial={paycheckModal.mode === 'edit' ? paycheckModal.paycheck : undefined}
          onSave={handleSavePaycheck}
          onClose={() => setPaycheckModal(null)}
          onDelete={paycheckModal.mode === 'edit' ? handleDeletePaycheck : undefined}
        />
      )}

      {billModal && (
        <BillForm
          initial={billModal.mode === 'edit' ? billModal.bill : undefined}
          onSave={handleSaveBill}
          onClose={() => setBillModal(null)}
          onDelete={billModal.mode === 'edit' ? handleDeleteBill : undefined}
        />
      )}
    </div>
  )
}

export default App
