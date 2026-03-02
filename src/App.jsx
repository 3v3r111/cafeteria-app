import { useEffect, useState } from 'react'
import { supabase } from './shared/lib/supabase'

function App() {
  const [status, setStatus] = useState('Conectando...')

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('_test').select().limit(1)
        // Este error es esperado (tabla no existe), pero confirma que hay conexión
        if (error?.code === '42P01' || error?.code === 'PGRST116') {
          setStatus('✓ Conexión con Supabase exitosa')
        } else if (error) {
          setStatus(`Error: ${error.message}`)
        }
      } catch (e) {
        setStatus('Error de conexión. Verifica tus variables de entorno.')
      }
    }
    checkConnection()
  }, [])

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold text-emerald-600 mb-4">Cafetería App</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}

export default App