import { useEffect, useState } from 'react'
import type { Bill, Expense, Fund } from './types'
import { useLocalStorage } from './useLocalStorage'
import { addMonthClamped, generateId, todayISO } from './utils'
import { PlanningTable } from './components/PlanningTable'
import { FundForm } from './components/FundForm'
import { BillForm, type BillDraft } from './components/BillForm'
import { BillStatusModal, type BillStatusUpdate } from './components/BillStatusModal'

type FundModalState = { mode: 'add' } | { mode: 'edit'; fund: Fund } | null
type BillModalState = { mode: 'add' } | { mode: 'edit'; bill: Bill } | null

function App() {
  // Storage key stays "paychecks" to avoid orphaning data already saved by users.
  const [funds, setFunds] = useLocalStorage<Fund[]>('paychecks', [])
  const [bills, setBills] = useLocalStorage<Bill[]>('bills', [])

  // One-time migration: bills saved before the assignedPaycheckId -> assignedFundId rename.
  useEffect(() => {
    setBills((prev) =>
      prev.map((b) => {
        const legacy = b as Bill & { assignedPaycheckId?: string | null }
        if (b.assignedFundId !== undefined || legacy.assignedPaycheckId === undefined) return b
        const { assignedPaycheckId, ...rest } = legacy
        return { ...rest, assignedFundId: assignedPaycheckId }
      }),
    )
  }, [])

  // Roll recurring-monthly bills' due dates forward once their due date has passed,
  // resetting the cycle-specific assignment/status/planned-payment-date.
  useEffect(() => {
    const today = todayISO()
    setBills((prev) =>
      prev.map((b) => {
        if (!b.recurringMonthly) return b
        let dueDate = b.dueDate
        let rolled = false
        while (dueDate < today) {
          dueDate = addMonthClamped(dueDate)
          rolled = true
        }
        if (!rolled) return b
        return { ...b, dueDate, assignedFundId: null, status: 'planned', plannedPaymentDate: null }
      }),
    )
  }, [])

  const [customChipOptions, setCustomChipOptions] = useLocalStorage<string[]>('customChipOptions', [])
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', [])
  const [fundModal, setFundModal] = useState<FundModalState>(null)
  const [billModal, setBillModal] = useState<BillModalState>(null)
  const [statusModalBill, setStatusModalBill] = useState<Bill | null>(null)

  function handleSaveFund(draft: Pick<Fund, 'date' | 'amount'>) {
    if (fundModal?.mode === 'edit') {
      const id = fundModal.fund.id
      setFunds((prev) => prev.map((f) => (f.id === id ? { ...f, ...draft } : f)))
    } else {
      setFunds((prev) => [...prev, { id: generateId(), ...draft }])
    }
  }

  function handleDeleteFund() {
    if (fundModal?.mode !== 'edit') return
    const id = fundModal.fund.id
    setFunds((prev) => prev.filter((f) => f.id !== id))
    setBills((prev) => prev.map((b) => (b.assignedFundId === id ? { ...b, assignedFundId: null } : b)))
    setExpenses((prev) => prev.filter((e) => e.fundId !== id))
    setFundModal(null)
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
          assignedFundId: null,
          customChips: [],
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

  function handleAssignBill(billId: string, fundId: string | null) {
    setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, assignedFundId: fundId } : b)))
  }

  function handleCreateCustomChip(label: string) {
    setCustomChipOptions((prev) =>
      prev.some((opt) => opt.toLowerCase() === label.toLowerCase()) ? prev : [...prev, label],
    )
  }

  function handleSaveBillStatus(billId: string, update: BillStatusUpdate) {
    setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, ...update } : b)))
  }

  function handleAddExpense(fundId: string, label: string, amount: number) {
    setExpenses((prev) => [...prev, { id: generateId(), fundId, label, amount }])
  }

  function handleDeleteExpense(expenseId: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
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
          funds={funds}
          expenses={expenses}
          onAssignBill={handleAssignBill}
          onEditBill={(bill) => setBillModal({ mode: 'edit', bill })}
          onOpenBillStatus={(bill) => setStatusModalBill(bill)}
          onEditFund={(fund) => setFundModal({ mode: 'edit', fund })}
          onAddFund={() => setFundModal({ mode: 'add' })}
          onAddBill={() => setBillModal({ mode: 'add' })}
          onReorderBills={handleReorderBills}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      </div>

      {fundModal && (
        <FundForm
          initial={fundModal.mode === 'edit' ? fundModal.fund : undefined}
          onSave={handleSaveFund}
          onClose={() => setFundModal(null)}
          onDelete={fundModal.mode === 'edit' ? handleDeleteFund : undefined}
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

      {statusModalBill && (
        <BillStatusModal
          bill={statusModalBill}
          customChipOptions={customChipOptions}
          onCreateCustomChip={handleCreateCustomChip}
          onSave={handleSaveBillStatus}
          onClose={() => setStatusModalBill(null)}
        />
      )}
    </div>
  )
}

export default App
