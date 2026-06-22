import { useRegisterSW } from 'virtual:pwa-register/react'

/*
 * Shows an "Update available" banner when a new service worker (new app build)
 * is waiting. Tapping Update activates it and reloads — no reinstall needed.
 * Also polls hourly so a long-open installed PWA notices new versions.
 */
export default function UpdatePrompt() {
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

  if (!needRefresh) return null

  return (
    <div className="rs-update" role="alert">
      <div className="rs-update-text">
        <strong>New orders available</strong>
        <span>A new version of Recon Shelf is ready.</span>
      </div>
      <div className="rs-update-actions">
        <button className="rs-btn rs-btn-primary" onClick={() => updateServiceWorker(true)}>
          Update
        </button>
        <button className="rs-update-later" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
      </div>
    </div>
  )
}
