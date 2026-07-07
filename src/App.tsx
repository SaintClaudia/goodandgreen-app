import { useState } from 'react'
import type { Bill, Paycheck, PaymentStatus } from './types'
import { useLocalStorage } from './useLocalStorage'
import { generateId, sortByDueDate } from './utils'
import { PlanningTable } from './components/PlanningTable'
import { PaycheckForm } from './components/PaycheckForm'
import { BillForm, type BillDraft } from './components/BillForm'

type PaycheckModalState = { mode: 'add' } | { mode: 'edit'; paycheck: Paycheck } | null
type BillModalState = { mode: 'add' } | { mode: 'edit'; bill: Bill } | null

function App() {
  const [paychecks, setPaychecks] = useLocalStorage<Paycheck[]>('paychecks', [])
  const [bills, setBills] = useLocalStorage<Bill[]>('bills', [])
  const [paycheckModal, setPaycheckModal] = useState<PaycheckModalState>(null)
  const [billModal, setBillModal] = useState<BillModalState>(null)

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
    <div className="min-h-full bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <h1 className="text-lg font-semibold text-slate-900">Paycheck Bill Planner</h1>
          <p className="text-sm text-slate-500">
            Plan which bills come out of each paycheck and track what's cleared.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBillModal({ mode: 'add' })}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Add bill
          </button>
          <button
            type="button"
            onClick={() => setPaycheckModal({ mode: 'add' })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            + Add paycheck
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
      </main>

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
