import { useEffect, useRef, useState } from 'react'
import type { Assignment, Bill, Expense, Fund, PaymentStatus } from './types'
import { useLocalStorage } from './useLocalStorage'
import { addMonthClamped, generateId, todayISO } from './utils'
import { PlanningTable } from './components/PlanningTable'
import { FundForm } from './components/FundForm'
import { BillForm, type BillDraft } from './components/BillForm'
import { BillStatusModal, type BillStatusUpdate } from './components/BillStatusModal'

type FundModalState = { mode: 'add' } | { mode: 'edit'; fund: Fund } | null
type BillModalState = { mode: 'add' } | { mode: 'edit'; bill: Bill } | null
type StatusModalTarget = { bill: Bill; assignment: Assignment } | null

type LegacyBill = Bill & {
  assignedPaycheckId?: string | null
  assignedFundId?: string | null
  status?: PaymentStatus
  customChips?: string[]
  plannedPaymentDate?: string | null
}

function App() {
  // Storage key stays "paychecks" to avoid orphaning data already saved by users.
  const [funds, setFunds] = useLocalStorage<Fund[]>('paychecks', [])
  const [bills, setBills] = useLocalStorage<Bill[]>('bills', [])
  const [assignments, setAssignments] = useLocalStorage<Assignment[]>('assignments', [])
  const [customChipOptions, setCustomChipOptions] = useLocalStorage<string[]>('customChipOptions', [])

  // One-time migration: bills saved before assignment moved off the bill into its own
  // per-fund record (also covers the older assignedPaycheckId -> assignedFundId rename).
  // Guarded by a ref (not just the empty dep array) because React StrictMode double-invokes
  // effects in dev, which would otherwise create duplicate assignments.
  const didMigrate = useRef(false)
  useEffect(() => {
    if (didMigrate.current) return
    didMigrate.current = true

    const legacyBills = bills as LegacyBill[]
    const needsMigration = legacyBills.some(
      (b) => b.assignedPaycheckId !== undefined || b.assignedFundId !== undefined,
    )
    if (!needsMigration) return

    const newAssignments: Assignment[] = []
    const legacyChipLabels = new Set<string>()
    const cleanedBills: Bill[] = legacyBills.map((b) => {
      const fundId = b.assignedFundId !== undefined ? b.assignedFundId : b.assignedPaycheckId
      if (fundId != null) {
        const chips = b.customChips ?? []
        chips.forEach((label) => legacyChipLabels.add(label))
        newAssignments.push({
          id: generateId(),
          billId: b.id,
          fundId,
          status: b.status ?? 'planned',
          notes: '',
          customChips: chips,
          plannedPaymentDate: b.plannedPaymentDate ?? null,
        })
      }
      const { assignedPaycheckId, assignedFundId, status, customChips, plannedPaymentDate, ...rest } = b
      return rest
    })

    setBills(cleanedBills)
    if (newAssignments.length > 0) {
      setAssignments((prev) => [...prev, ...newAssignments])
    }
    if (legacyChipLabels.size > 0) {
      setCustomChipOptions((prev) => {
        const next = [...prev]
        for (const label of legacyChipLabels) {
          if (!next.some((opt) => opt.toLowerCase() === label.toLowerCase())) next.push(label)
        }
        return next
      })
    }
  }, [])

  // Roll recurring-monthly bills' due dates forward once their due date has passed.
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
        return rolled ? { ...b, dueDate } : b
      }),
    )
  }, [])

  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', [])
  const [fundModal, setFundModal] = useState<FundModalState>(null)
  const [billModal, setBillModal] = useState<BillModalState>(null)
  const [statusModalTarget, setStatusModalTarget] = useState<StatusModalTarget>(null)

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
    setAssignments((prev) => prev.filter((a) => a.fundId !== id))
    setExpenses((prev) => prev.filter((e) => e.fundId !== id))
    setFundModal(null)
  }

  function handleSaveBill(draft: BillDraft) {
    if (billModal?.mode === 'edit') {
      const id = billModal.bill.id
      setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...draft } : b)))
    } else {
      setBills((prev) => [...prev, { id: generateId(), ...draft }])
    }
  }

  function handleDeleteBill() {
    if (billModal?.mode !== 'edit') return
    const id = billModal.bill.id
    setBills((prev) => prev.filter((b) => b.id !== id))
    setAssignments((prev) => prev.filter((a) => a.billId !== id))
    setBillModal(null)
  }

  function handleAssignBill(billId: string, fundId: string) {
    setAssignments((prev) => {
      if (prev.some((a) => a.billId === billId && a.fundId === fundId)) return prev
      return [
        ...prev,
        {
          id: generateId(),
          billId,
          fundId,
          status: 'planned',
          notes: '',
          customChips: [],
          plannedPaymentDate: null,
        },
      ]
    })
  }

  function handleUnassignBill(billId: string, fundId: string) {
    setAssignments((prev) => prev.filter((a) => !(a.billId === billId && a.fundId === fundId)))
  }

  function handleCreateCustomChip(label: string) {
    setCustomChipOptions((prev) =>
      prev.some((opt) => opt.toLowerCase() === label.toLowerCase()) ? prev : [...prev, label],
    )
  }

  function handleSaveBillStatus(assignmentId: string, update: BillStatusUpdate) {
    setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? { ...a, ...update } : a)))
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
          assignments={assignments}
          expenses={expenses}
          onAssignBill={handleAssignBill}
          onUnassignBill={handleUnassignBill}
          onEditBill={(bill) => setBillModal({ mode: 'edit', bill })}
          onOpenBillStatus={(bill, assignment) => setStatusModalTarget({ bill, assignment })}
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

      {statusModalTarget && (
        <BillStatusModal
          bill={statusModalTarget.bill}
          assignment={statusModalTarget.assignment}
          customChipOptions={customChipOptions}
          onCreateCustomChip={handleCreateCustomChip}
          onSave={handleSaveBillStatus}
          onClose={() => setStatusModalTarget(null)}
        />
      )}
    </div>
  )
}

export default App
