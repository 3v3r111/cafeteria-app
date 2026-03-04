import { useState, useCallback } from 'react'
import { supabase } from '../../shared/lib/supabase'
import toast from 'react-hot-toast'

export const EXPENSE_CATEGORIES = [
  { id: 'payroll',     label: 'Nómina',              icon: '👥' },
  { id: 'inventory',   label: 'Inventario',           icon: '📦' },
  { id: 'rent',        label: 'Renta',                icon: '🏠' },
  { id: 'utilities',   label: 'Servicios (luz/agua)', icon: '💡' },
  { id: 'maintenance', label: 'Mantenimiento',        icon: '🔧' },
  { id: 'marketing',   label: 'Marketing',            icon: '📣' },
  { id: 'other',       label: 'Otro',                 icon: '📋' },
]

export function useFinance() {
  const [expenses, setExpenses] = useState([])
  const [payments, setPayments] = useState([])
  const [cancellations, setCancellations] = useState([])
  const [loading, setLoading] = useState(false)

  // ── Fetch expenses ────────────────────────────────────────────────
  const fetchExpenses = useCallback(async ({ from, to } = {}) => {
    setLoading(true)
    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })

    if (from) query = query.gte('date', from)
    if (to)   query = query.lte('date', to)

    const { data, error } = await query
    setLoading(false)
    if (error) { toast.error('Error cargando gastos'); return }
    setExpenses(data ?? [])
  }, [])

  // ── Fetch payments (ingresos) ─────────────────────────────────────
  const fetchPayments = useCallback(async ({ from, to } = {}) => {
    let query = supabase
      .from('payments')
      .select(`
        id, total, payment_method, created_at, discount_amount,
        orders ( tables(number, name) )
      `)
      .order('created_at', { ascending: false })

    if (from) query = query.gte('created_at', from + 'T00:00:00')
    if (to)   query = query.lte('created_at', to   + 'T23:59:59')

    const { data, error } = await query
    if (error) { toast.error('Error cargando ingresos'); return }
    setPayments(data ?? [])
  }, [])

  // ── Fetch cancellations (descuentos post-pago) ────────────────────
  const fetchCancellations = useCallback(async ({ from, to } = {}) => {
    let query = supabase
      .from('payment_cancellations')
      .select('amount, created_at')
      .order('created_at', { ascending: false })

    if (from) query = query.gte('created_at', from + 'T00:00:00')
    if (to)   query = query.lte('created_at', to   + 'T23:59:59')

    const { data, error } = await query
    if (error) return
    setCancellations(data ?? [])
  }, [])

  // ── Fetch all for a date range ────────────────────────────────────
  const fetchAll = useCallback(async (range) => {
    await Promise.all([
      fetchExpenses(range),
      fetchPayments(range),
      fetchCancellations(range),
    ])
  }, [fetchExpenses, fetchPayments, fetchCancellations])

  // ── CRUD Expenses ─────────────────────────────────────────────────
  async function addExpense({ category, subcategory, description, amount, date }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('expenses')
      .insert({
        category,
        subcategory: subcategory || null,
        description,
        amount: Number(amount),
        date: date || new Date().toISOString().split('T')[0],
        user_id: user?.id
      })
    if (error) { toast.error('Error registrando gasto'); return false }
    toast.success('Gasto registrado')
    return true
  }

  async function updateExpense(id, { category, subcategory, description, amount, date }) {
    const { error } = await supabase
      .from('expenses')
      .update({ category, subcategory: subcategory || null, description,
                amount: Number(amount), date })
      .eq('id', id)
    if (error) { toast.error('Error actualizando gasto'); return false }
    toast.success('Gasto actualizado')
    return true
  }

  async function deleteExpense(id) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    if (error) { toast.error('Error eliminando gasto'); return false }
    toast.success('Gasto eliminado')
    return true
  }

  // ── Computed summary ──────────────────────────────────────────────
  function getSummary() {
    const grossIncome  = payments.reduce((s, p) => s + Number(p.total), 0)
    const cancelled    = cancellations.reduce((s, c) => s + Number(c.amount), 0)
    const netIncome    = grossIncome - cancelled
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const netProfit    = netIncome - totalExpenses
    const margin       = netIncome > 0 ? (netProfit / netIncome) * 100 : 0

    const byCategory = EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      total: expenses
        .filter(e => e.category === cat.id)
        .reduce((s, e) => s + Number(e.amount), 0)
    })).filter(c => c.total > 0)

    const byMethod = ['cash', 'card', 'transfer'].map(m => ({
      method: m,
      total: payments
        .filter(p => p.payment_method === m)
        .reduce((s, p) => s + Number(p.total), 0)
    }))

    return { grossIncome, cancelled, netIncome, totalExpenses, netProfit, margin,
             byCategory, byMethod }
  }

  // ── Daily series for charts ───────────────────────────────────────
  function getDailySeries(from, to) {
    const days = []
    const start = new Date(from)
    const end   = new Date(to)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      const dayIncome = payments
        .filter(p => p.created_at.startsWith(key))
        .reduce((s, p) => s + Number(p.total), 0)
      const dayExpenses = expenses
        .filter(e => e.date === key)
        .reduce((s, e) => s + Number(e.amount), 0)
      days.push({ date: key, income: dayIncome, expenses: dayExpenses,
                  profit: dayIncome - dayExpenses })
    }
    return days
  }

  return {
    expenses, payments, cancellations, loading,
    fetchExpenses, fetchPayments, fetchAll,
    addExpense, updateExpense, deleteExpense,
    getSummary, getDailySeries,
  }
}
