import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ToastProvider } from './components/Toast'
import Login from './auth/Login'
import Layout from './components/Layout'
import Shelf from './pages/Shelf'
import Dossier from './pages/Dossier'
import AddBook from './pages/AddBook'
import FullShelf from './pages/FullShelf'
import Recap from './pages/Recap'
import Settings from './pages/Settings'

function Gate() {
  const { session, loading, configured } = useAuth()

  if (loading) return <div className="rs-spinner-wrap">Securing the channel…</div>
  if (!configured || !session) return <Login />

  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Shelf />} />
          <Route path="shelf/all" element={<FullShelf />} />
          <Route path="book/new" element={<AddBook />} />
          <Route path="book/:id" element={<Dossier />} />
          <Route path="recap/:year" element={<Recap />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  )
}
