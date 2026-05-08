'use client'
// app/expenses/page.tsx

import { useState, useEffect, useCallback } from 'react'
import {
  getExpenses, updateExpense, deleteExpense,
  getCategories, addCategory, deleteCategory, renameCategory,
  type Expense,
} from '@/lib/api'
import {
  Pencil, Trash2, Check, X, Plus, Tag,
  Loader2, AlertCircle, ChevronDown, Search
} from 'lucide-react'
import { clsx } from 'clsx'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ── Inline editable cell ──────────────────────────────────────────────────────
function EditableCell({
  value, onSave, type = 'text', options,
}: {
  value: string | number
  onSave: (v: string) => Promise<void>
  type?: 'text' | 'select' | 'number'
  options?: string[]
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(value))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await onSave(val)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        className="flex items-center gap-1.5 group/cell text-left"
        onClick={() => setEditing(true)}
      >
        <span>{value}</span>
        <Pencil className="w-3 h-3 text-slate-600 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {type === 'select' && options ? (
        <select
          className="select text-sm py-1 px-2"
          value={val}
          onChange={e => setVal(e.target.value)}
          autoFocus
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          className="input text-sm py-1 px-2 w-32"
          value={val}
          onChange={e => setVal(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        />
      )}
      <button onClick={save} disabled={saving} className="p-1 text-emerald-400 hover:text-emerald-300">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      </button>
      <button onClick={() => setEditing(false)} className="p-1 text-slate-500 hover:text-slate-300">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// ── Category manager panel ────────────────────────────────────────────────────
function CategoryPanel({
  categories,
  onUpdate,
}: {
  categories: string[]
  onUpdate: (cats: string[]) => void
}) {
  const [newCat, setNewCat] = useState('')
  const [error, setError] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')

  const add = async () => {
    if (!newCat.trim()) return
    try {
      const cats = await addCategory(newCat.trim())
      onUpdate(cats)
      setNewCat('')
      setError('')
    } catch (e: any) { setError(e.message) }
  }

  const del = async (cat: string) => {
    const cats = await deleteCategory(cat)
    onUpdate(cats)
  }

  const startRename = (cat: string) => { setRenaming(cat); setRenameVal(cat) }

  const confirmRename = async () => {
    if (!renaming || !renameVal.trim()) return
    try {
      const cats = await renameCategory(renaming, renameVal.trim())
      onUpdate(cats)
      setRenaming(null)
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-brand-400" />
        <h3 className="font-semibold text-white">Manage Categories</h3>
      </div>

      <div className="flex gap-2">
        <input
          className="input text-sm py-2"
          placeholder="New category name"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button className="btn-primary px-3 py-2 flex items-center gap-1 text-sm" onClick={add}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
        {categories.map(cat => (
          <div
            key={cat}
            className="flex items-center gap-1 bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-sm"
          >
            {renaming === cat ? (
              <>
                <input
                  className="input text-xs py-0.5 w-24"
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenaming(null) }}
                  autoFocus
                />
                <button onClick={confirmRename} className="text-emerald-400 hover:text-emerald-300 p-0.5">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setRenaming(null)} className="text-slate-500 hover:text-slate-300 p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <span className="text-slate-300">{cat}</span>
                <button onClick={() => startRename(cat)} className="text-slate-600 hover:text-slate-300 p-0.5 ml-1">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => del(cat)} className="text-slate-600 hover:text-red-400 p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ExpensesContent() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [showCatPanel, setShowCatPanel] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [exps, cats] = await Promise.all([getExpenses(), getCategories()])
    setExpenses(exps)
    setCategories(cats)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpdate = async (id: string, patch: Record<string, any>) => {
    const updated = await updateExpense(id, patch)
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    setDeleting(id)
    setError('')
    try {
      await deleteExpense(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.vendor.toLowerCase().includes(q) || e.bill_name.toLowerCase().includes(q)
    const matchType = !filterType || e.expense_type === filterType
    const matchCat = !filterCat || e.category === filterCat
    return matchSearch && matchType && matchCat
  })

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      {/* Error Alert */}
      {error && (
        <div className="opacity-0 animate-fade-up bg-red-500/10 border border-red-500/20 rounded-lg p-3 md:p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="opacity-0 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Expenses</h1>
            <p className="text-sm md:text-base text-slate-400 mt-1">{expenses.length} bills tracked</p>
          </div>
          <button
            className="btn-ghost flex items-center justify-center gap-2 text-xs md:text-sm w-full sm:w-auto"
            onClick={() => setShowCatPanel(!showCatPanel)}
          >
            <Tag className="w-4 h-4" /> Manage Categories
            <ChevronDown className={clsx('w-4 h-4 transition-transform', showCatPanel && 'rotate-180')} />
          </button>
        </div>
      </div>

      {showCatPanel && (
        <div className="opacity-0 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
          <CategoryPanel categories={categories} onUpdate={setCategories} />
        </div>
      )}

      {/* Filters */}
      <div
        className="opacity-0 animate-fade-up flex flex-col md:flex-row gap-2 md:gap-3"
        style={{ animationDelay: '60ms', animationFillMode: 'forwards' }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="input pl-9 text-sm w-full"
            placeholder="Search vendor or file…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="select text-sm w-full md:w-40" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="Personal">Personal</option>
          <option value="Business">Business</option>
        </select>
        <select className="select text-sm w-full md:w-44" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table - Desktop, Cards - Mobile */}
      <div
        className="opacity-0 animate-fade-up"
        style={{ animationDelay: '120ms', animationFillMode: 'forwards' }}
      >
        {/* Desktop Table */}
        <div className="hidden md:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface">
                  <th className="text-left px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Bill</th>
                  <th className="text-left px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Vendor</th>
                  <th className="text-left px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</th>
                  <th className="text-right px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
                  <th className="text-right px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">GST</th>
                  <th className="text-left px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                  <th className="px-4 md:px-5 py-3 md:py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-surface-border">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 md:px-5 py-3 md:py-4">
                          <div className="shimmer h-4 rounded-md w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 md:px-5 py-8 md:py-16 text-center text-slate-500 text-sm">
                      {expenses.length === 0
                        ? 'No expenses yet – upload a bill to get started.'
                        : 'No results match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((exp, idx) => (
                    <tr
                      key={exp.id}
                      className={clsx(
                        'border-b border-surface-border transition-colors hover:bg-white/[0.02]',
                        idx % 2 === 0 ? '' : 'bg-white/[0.01]'
                      )}
                    >
                      <td className="px-4 md:px-5 py-3 md:py-4 max-w-[120px] md:max-w-[160px] truncate text-slate-300 text-xs md:text-sm">
                        {exp.bill_name}
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-slate-200 font-medium text-xs md:text-sm">
                        <EditableCell
                          value={exp.vendor}
                          onSave={v => handleUpdate(exp.id, { vendor: v })}
                        />
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm">
                        <EditableCell
                          value={exp.category}
                          type="select"
                          options={categories}
                          onSave={v => handleUpdate(exp.id, { category: v })}
                        />
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm">
                        <EditableCell
                          value={exp.expense_type}
                          type="select"
                          options={['Personal', 'Business']}
                          onSave={v => handleUpdate(exp.id, { expense_type: v })}
                        />
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-right font-mono text-white text-xs md:text-sm">
                        <EditableCell
                          value={exp.amount}
                          type="number"
                          onSave={v => handleUpdate(exp.id, { amount: parseFloat(v) })}
                        />
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-right font-mono text-amber-400 text-xs md:text-sm">
                        {fmt(exp.gst)}
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-slate-400 font-mono text-xs">
                        {exp.date ?? '—'}
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-4">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={deleting === exp.id}
                          className={clsx(
                            'p-1.5 rounded-lg transition-colors',
                            deleting === exp.id
                              ? 'text-slate-600 cursor-not-allowed'
                              : 'text-slate-600 hover:text-red-400 hover:bg-red-500/10'
                          )}
                        >
                          {deleting === exp.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer totals */}
          {filtered.length > 0 && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-end gap-3 md:gap-8 px-4 md:px-5 py-3 bg-surface border-t border-surface-border text-xs md:text-sm">
              <span className="text-slate-500">{filtered.length} rows</span>
              <span className="text-slate-400">
                Total: <span className="text-white font-semibold font-mono">
                  {fmt(filtered.reduce((s, e) => s + e.amount, 0))}
                </span>
              </span>
              <span className="text-slate-400">
                GST: <span className="text-amber-400 font-semibold font-mono">
                  {fmt(filtered.reduce((s, e) => s + e.gst, 0))}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-2">
                <div className="shimmer h-4 rounded-md w-1/2" />
                <div className="shimmer h-3 rounded-md w-full" />
                <div className="shimmer h-3 rounded-md w-3/4" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="card p-8 text-center text-slate-500 text-sm">
              {expenses.length === 0
                ? 'No expenses yet – upload a bill to get started.'
                : 'No results match your filters.'}
            </div>
          ) : (
            filtered.map(exp => (
              <div key={exp.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white text-sm truncate">{exp.vendor}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{exp.bill_name}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    disabled={deleting === exp.id}
                    className={clsx(
                      'p-1 rounded-lg transition-colors shrink-0',
                      deleting === exp.id
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-600 hover:text-red-400 hover:bg-red-500/10'
                    )}
                  >
                    {deleting === exp.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Category</p>
                    <EditableCell
                      value={exp.category}
                      type="select"
                      options={categories}
                      onSave={v => handleUpdate(exp.id, { category: v })}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <EditableCell
                      value={exp.expense_type}
                      type="select"
                      options={['Personal', 'Business']}
                      onSave={v => handleUpdate(exp.id, { expense_type: v })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="text-sm font-mono font-semibold text-white">
                      {fmt(exp.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">GST</p>
                    <p className="text-sm font-mono font-semibold text-amber-400">
                      {fmt(exp.gst)}
                    </p>
                  </div>
                </div>

                {exp.date && (
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="text-xs font-mono text-slate-400">{exp.date}</p>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Mobile totals */}
          {filtered.length > 0 && (
            <div className="card p-4 bg-surface border-t border-surface-border space-y-2">
              <p className="text-xs text-slate-500">{filtered.length} bills</p>
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-sm font-mono font-semibold text-white">
                  {fmt(filtered.reduce((s, e) => s + e.amount, 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">GST</p>
                <p className="text-sm font-mono font-semibold text-amber-400">
                  {fmt(filtered.reduce((s, e) => s + e.gst, 0))}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ExpensesPage() {
  return (
    <ProtectedRoute>
      <div className="flex flex-col md:flex-row md:h-screen md:overflow-hidden bg-surface text-slate-200">
        <MobileNav />
        <Sidebar />
        <main className="flex-1 overflow-y-auto md:overflow-auto">
          <ExpensesContent />
        </main>
      </div>
    </ProtectedRoute>
  )
}
