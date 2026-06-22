import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/*
 * Shows an "Update available" banner when a new service worker (new app build)
 * is waiting. Tapping Update activates it and reloads — no reinstall needed.
 * Also polls hourly so a long-open installed PWA notices new versions.
 *
 * The update handler is deliberately belt-and-suspenders: vite-plugin-pwa's
 * auto-reload after skip-waiting doesn't always fire (notably the first time the
 * worker transitions), so we also listen for controllerchange and keep a
 * timeout fallback. That guarantees the button always does something.
 */
export default function UpdatePrompt() {
  const [updating, setUpdating] = useState(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000)
      }
    },
  })

  async function applyUpdate() {
    setUpdating(true)
    // 1) Reload the moment the new worker takes control.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
        once: true,
      })
    }
    // 2) Ask the waiting worker to activate (workbox also tries to reload).
    try {
      await updateServiceWorker(true)
    } catch {
      /* ignore — fallback below still runs */
    }
    // 3) Safety net if neither of the above reloads the page.
    setTimeout(() => window.location.reload(), 2500)
  }

  if (!needRefresh) return null

  return (
    <div className="rs-update" role="alert">
      <div className="rs-update-text">
        <strong>New orders available</strong>
        <span>A new version of Recon Shelf is ready.</span>
      </div>
      <div className="rs-update-actions">
        <button className="rs-btn rs-btn-primary" onClick={applyUpdate} disabled={updating}>
          {updating ? 'Updating…' : 'Update'}
        </button>
        <button
          className="rs-update-later"
          onClick={() => setNeedRefresh(false)}
          disabled={updating}
        >
          Later
        </button>
      </div>
    </div>
  )
}
