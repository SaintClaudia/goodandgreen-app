import { useState } from 'react'
import type { Bill, Paycheck } from './types'
import { useLocalStorage } from './useLocalStorage'
import { generateId } from './utils'
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

  function handleReorderBills(draggedId: string, targetId: string) {
    if (draggedId === targetId) return
    setBills((prev) => {
      const draggedIndex = prev.findIndex((b) => b.id === draggedId)
      if (draggedIndex === -1) return prev
      const next = [...prev]
      const [dragged] = next.splice(draggedIndex, 1)
      const targetIndex = next.findIndex((b) => b.id === targetId)
      if (targetIndex === -1) return prev
      next.splice(targetIndex, 0, dragged)
      return next
    })
  }

  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <header className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#0bf81e]" />
          <span className="text-[13px] text-[var(--text)]">sheets</span>
        </header>

        <PlanningTable
          bills={bills}
          paychecks={paychecks}
          onAssignBill={handleAssignBill}
          onEditBill={(bill) => setBillModal({ mode: 'edit', bill })}
          onEditPaycheck={(paycheck) => setPaycheckModal({ mode: 'edit', paycheck })}
          onAddPaycheck={() => setPaycheckModal({ mode: 'add' })}
          onAddBill={() => setBillModal({ mode: 'add' })}
          onReorderBills={handleReorderBills}
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
