import { createContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../../shared/lib/supabase'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const initialized = useRef(false)
  const profileRef  = useRef(null)   // copia sincrónica del profile actual

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
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        const profileData = await fetchProfile(session.user.id)
        profileRef.current = profileData
        setProfile(profileData)
      }

      setLoading(false)

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event)

        if (event === 'SIGNED_OUT') {
          profileRef.current = null
          setUser(null)
          setProfile(null)
          return
        }

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          // Si ya tenemos el perfil de este usuario, no lo reseteamos.
          // Supabase re-emite SIGNED_IN al volver al primer plano,
          // lo que causaba que profile quedara null durante el refetch.
          if (profileRef.current?.user_id === session.user.id) return
          const profileData = await fetchProfile(session.user.id)
          profileRef.current = profileData
          setProfile(profileData)
          return
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          if (!profileRef.current) {
            const profileData = await fetchProfile(session.user.id)
            profileRef.current = profileData
            setProfile(profileData)
          }
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
    profileRef.current = null
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    role:      profile?.role ?? null,
    isAdmin:   profile?.role === 'admin',
    isWaiter:  profile?.role === 'waiter',
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
