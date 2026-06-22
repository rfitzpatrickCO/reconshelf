import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ToastProvider } from './components/Toast'
import { getSettings } from './lib/db'
import Login from './auth/Login'
import Onboarding from './onboarding/Onboarding'
import LoadingScreen from './components/LoadingScreen'
import UpdatePrompt from './components/UpdatePrompt'
import Layout from './components/Layout'
import Shelf from './pages/Shelf'
import Dossier from './pages/Dossier'
import AddBook from './pages/AddBook'
import FullShelf from './pages/FullShelf'
import Recap from './pages/Recap'
import Commendations from './pages/Commendations'
import Profile from './pages/Profile'

function AppRoutes() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Shelf />} />
          <Route path="shelf/all" element={<FullShelf />} />
          <Route path="book/new" element={<AddBook />} />
          <Route path="book/:id" element={<Dossier />} />
          <Route path="recap/:year" element={<Recap />} />
          <Route path="commendations" element={<Commendations />} />
          <Route path="profile" element={<Profile />} />
          {/* keep the old /settings path working */}
          <Route path="settings" element={<Navigate to="/profile" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}

// Once authenticated, decide between onboarding and the app based on the profile.
function AuthedApp() {
  const [profile, setProfile] = useState(undefined) // undefined = loading
  const [error, setError] = useState('')

  async function load(minHold = false) {
    const startedAt = Date.now()
    try {
      const result = await getSettings()
      // On launch/login, hold the loading screen briefly so the quote is seen
      // rather than flashing by (data often loads in well under a second).
      if (minHold) {
        const elapsed = Date.now() - startedAt
        if (elapsed < 1300) await new Promise((r) => setTimeout(r, 1300 - elapsed))
      }
      setProfile(result)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load(true)
  }, [])

  if (error) return <div className="rs-spinner-wrap">Could not load your profile: {error}</div>
  if (profile === undefined) return <LoadingScreen />

  if (!profile || !profile.onboarded) {
    return <Onboarding onComplete={load} />
  }
  return <AppRoutes />
}

function Gate() {
  const { session, loading, configured } = useAuth()

  if (loading) return <LoadingScreen />
  if (!configured || !session) return <Login />

  return <AuthedApp />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Gate />
        <UpdatePrompt />
      </AuthProvider>
    </BrowserRouter>
  )
}
