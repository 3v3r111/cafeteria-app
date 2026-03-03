import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn, user, profile, loading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Redirigir si ya hay sesión activa — usando useEffect para evitar loops
  useEffect(() => {
    if (!loading && user && profile) {
      navigate('/salon', { replace: true })
    }
  }, [user, profile, loading, navigate])

  function validate() {
    const newErrors = {}
    if (!email.trim()) {
      newErrors.email = 'El correo es obligatorio'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Ingresa un correo válido'
    }
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria'
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres'
    }
    return newErrors
  }

  async function handleSubmit(e) {
  e.preventDefault()

  const validationErrors = validate()
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors)
    return
  }

  setErrors({})
  setIsSubmitting(true)

  const { error } = await signIn(email, password)

  if (error) {
    setIsSubmitting(false)
    if (error.message.includes('Invalid login credentials')) {
      toast.error('Correo o contraseña incorrectos')
    } else if (error.message.includes('Email not confirmed')) {
      toast.error('Debes confirmar tu correo antes de ingresar')
    } else {
      toast.error('Error al iniciar sesión. Intenta de nuevo.')
    }
    return
  }

  // Si en 5 segundos no navegó, desbloquear el botón
  setTimeout(() => setIsSubmitting(false), 5000)
}

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent 
                          rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-3">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-gray-100 
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center 
                          justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">☕</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Cafetería</h1>
          <p className="text-gray-500 mt-1">Sistema de Gestión Interno</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors(prev => ({ ...prev, email: null }))
                }}
                placeholder="correo@ejemplo.com"
                className={`w-full px-4 py-3 rounded-xl border text-gray-800
                            focus:outline-none focus:ring-2 focus:ring-emerald-400
                            transition-colors text-base
                            ${errors.email
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-200 bg-gray-50'}`}
                autoComplete="email"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors(prev => ({ ...prev, password: null }))
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border text-gray-800
                              focus:outline-none focus:ring-2 focus:ring-emerald-400
                              transition-colors text-base pr-12
                              ${errors.password
                                ? 'border-red-400 bg-red-50'
                                : 'border-gray-200 bg-gray-50'}`}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                             text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 
                               0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 
                               3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29 
                               -3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 
                               0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 
                               01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 
                               9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 
                               0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 
                         disabled:bg-emerald-300 text-white font-semibold 
                         rounded-xl transition-colors text-base
                         flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent 
                                  rounded-full animate-spin"></div>
                  Ingresando...
                </>
              ) : (
                'Ingresar al sistema'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Solo personal autorizado
        </p>
      </div>
    </div>
  )
}