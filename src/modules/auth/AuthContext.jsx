import { createContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../../shared/lib/supabase'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('fetchProfile error:', error)
      return null
    }
    return data
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

  async function initialize() {
    // Obtener sesión existente primero
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      setUser(session.user)
      const profileData = await fetchProfile(session.user.id)
      setProfile(profileData)
    }

    setLoading(false)

    // Escuchar cambios futuros
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        return
      }

      // Solo procesar SIGNED_IN si no hay sesión activa ya
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
        return
      }
    })
  }

    initialize()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    role: profile?.role ?? null,
    isAdmin: profile?.role === 'admin',
    isWaiter: profile?.role === 'waiter',
    isKitchen: profile?.role === 'kitchen',
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}