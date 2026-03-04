import { useState, useCallback } from 'react'
import { supabase } from '../../shared/lib/supabase'
import toast from 'react-hot-toast'

export function useCashRegister() {
  const [registers, setRegisters] = useState([])
  const [loading, setLoading] = useState(false)
  const [todaySummary, setTodaySummary] = useState(null)

  const fetchTodaySummary = useCallback(async () => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const { data: payments } = await supabase
      .from('payments')
      .select('total, payment_method')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    const { data: cancellations } = await supabase
      .from('payment_cancellations')
      .select('amount, cancellation_type, payment_id')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    if (!payments) return

    const totalSales = payments.reduce((sum, p) => sum + Number(p.total), 0)
    const cashSales = payments
      .filter(p => p.payment_method === 'cash')
      .reduce((sum, p) => sum + Number(p.total), 0)
    const cardSales = payments
      .filter(p => p.payment_method === 'card')
      .reduce((sum, p) => sum + Number(p.total), 0)
    const transferSales = payments
      .filter(p => p.payment_method === 'transfer')
      .reduce((sum, p) => sum + Number(p.total), 0)

    const totalCancelled = (cancellations ?? [])
      .reduce((sum, c) => sum + Number(c.amount), 0)

    setTodaySummary({
      totalSales,
      cashSales,
      cardSales,
      transferSales,
      totalCancelled,
      netSales: totalSales - totalCancelled,
      transactionCount: payments.length,
      cancellationCount: (cancellations ?? []).length
    })
  }, [])

  const fetchRegisters = useCallback(async (limit = 10) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cash_registers')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(limit)

    setLoading(false)
    if (error) { toast.error('Error cargando cortes'); return }
    setRegisters(data ?? [])
  }, [])

  async function saveCashRegister({ openingBalance, closingBalance,
    expectedBalance, difference, notes }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('cash_registers')
      .insert({
        opening_balance: openingBalance,
        closing_balance: closingBalance,
        expected_balance: expectedBalance,
        difference,
        notes: notes || null,
        user_id: user?.id ?? null,
        opened_at: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        closed_at: new Date().toISOString()
      })
    if (error) { toast.error('Error guardando corte'); return false }
    toast.success('Corte de caja guardado')
    await fetchRegisters()
    return true
  }

  async function closeDay() {
    // "Finalizar día" — solo guarda un registro de cierre, los datos históricos permanecen
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('cash_registers')
      .insert({
        opening_balance: 0,
        closing_balance: 0,
        expected_balance: 0,
        difference: 0,
        notes: 'Cierre de día',
        user_id: user?.id ?? null,
        opened_at: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        closed_at: new Date().toISOString()
      })
    if (error) { toast.error('Error cerrando día'); return false }
    toast.success('Día finalizado correctamente')
    await fetchRegisters()
    return true
  }

  return {
    registers, loading, todaySummary,
    fetchTodaySummary, fetchRegisters, saveCashRegister, closeDay
  }
}