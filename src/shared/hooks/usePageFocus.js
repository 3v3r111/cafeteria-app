import { useEffect } from 'react'

/**
 * Ejecuta `onFocus` cuando el usuario regresa a la pestaña o app.
 * Se usa en cada página para refrescar datos sin depender de un bus global.
 */
export function usePageFocus(onFocus, delay = 500) {
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        setTimeout(onFocus, delay)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [onFocus, delay])
}
