import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, visibilityBus } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useNotifications(role) {
  const [notifications, setNotifications] = useState([])
  const audioRef = useRef(null)

  // Sonido de notificación usando Web Audio API
  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
    } catch (e) {
      console.log('Audio no disponible')
    }
  }

  function addNotification(notification) {
    const newNotif = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
      ...notification
    }
    setNotifications(prev => [newNotif, ...prev].slice(0, 50))
    playNotificationSound()
    return newNotif
  }

  function markAsRead(id) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function clearAll() {
    setNotifications([])
  }

  // Solo meseros y admin reciben notificaciones de cocina
  useEffect(() => {
    if (!role || role === 'kitchen') return

    const channel = supabase
      .channel('notifications_channel')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'order_items',
        filter: 'status=eq.ready'
      }, async (payload) => {
        const itemId = payload.new.id

        // Obtener detalles del item, orden y mesa
        const { data } = await supabase
          .from('order_items')
          .select(`
            quantity,
            products (name),
            orders (
              id,
              tables (number, name)
            )
          `)
          .eq('id', itemId)
          .single()

        if (!data) return

        const tableNumber = data.orders?.tables?.number
        const tableName = data.orders?.tables?.name
        const productName = data.products?.name
        const quantity = data.quantity
        const tableLabel = tableName
          ? `Mesa ${tableNumber} · ${tableName}`
          : `Mesa ${tableNumber}`

        const notif = addNotification({
          type: 'item_ready',
          title: '¡Pedido listo para entregar!',
          tableNumber,
          tableName,
          tableLabel,
          productName,
          quantity,
          orderId: data.orders?.id,
          message: `x${quantity} ${productName} — ${tableLabel}`
        })

        // Toast visual también
        toast.success(
          `🍽️ Listo: x${quantity} ${productName}\n${tableLabel}`,
          {
            duration: 3000,
            style: {
              background: '#065f46',
              color: '#fff',
              fontSize: '14px'
            }
          }
        )
      })
      .subscribe()

    // Reconectar canal al volver al primer plano
    const unsubVisibility = visibilityBus.subscribe(() => {
      supabase.removeChannel(channel)
      // El canal se recrea al volver a ejecutar el efecto
      // forzando re-suscripción limpia
    })

    return () => {
      unsubVisibility()
      supabase.removeChannel(channel)
    }
  }, [role])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll
  }
}