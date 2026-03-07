import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

export async function fetchWithRetry(fetchFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fetchFn()
      if (!result.error) return result
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    } catch (e) {
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return { data: null, error: new Error('Max retries reached') }
}

// Event bus para sincronización manual entre módulos
export const syncBus = {
  listeners: new Set(),
  emit() {
    this.listeners.forEach(fn => fn())
  },
  subscribe(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

// Bus de visibilidad — se dispara cuando el usuario vuelve a la app
// después de tenerla en segundo plano o cambiar de pestaña.
// Cada hook se suscribe para hacer refetch y reconectar canales.
export const visibilityBus = {
  listeners: new Set(),
  emit() {
    this.listeners.forEach(fn => fn())
  },
  subscribe(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

// Registrar el listener de visibilidad una sola vez globalmente.
// El delay de 300ms da tiempo a Supabase de restaurar la sesión
// antes de que los hooks intenten hacer fetch.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(() => visibilityBus.emit(), 300)
    }
  })
}