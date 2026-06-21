import { createContext, useContext, useCallback, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const timer = useRef(null)

  const toast = useCallback((text) => {
    setMsg(text)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 2600)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {msg && <div className="rs-toast">{msg}</div>}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
