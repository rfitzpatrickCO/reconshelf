import { useState } from 'react'
import { useAuth } from './AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const { signInWithEmail, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  if (!configured) {
    return (
      <div className="rs-auth">
        <div className="rs-auth-card">
          <Logo />
          <h1 className="rs-auth-title">Not configured</h1>
          <p className="rs-auth-sub">
            Add your Supabase URL and anon key to a <code>.env</code> file, then restart the dev
            server. See <code>.env.example</code> and <code>SETUP.md</code>.
          </p>
        </div>
      </div>
    )
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setError('')
    try {
      await signInWithEmail(email.trim())
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Could not send the sign-in link.')
    }
  }

  return (
    <div className="rs-auth">
      <div className="rs-auth-card">
        <Logo />
        <h1 className="rs-auth-title">Report for duty</h1>

        {status === 'sent' ? (
          <>
            <p className="rs-auth-sub rs-auth-success">
              Orders sent. Check <strong>{email}</strong> for a sign-in link and tap it to enter
              your shelf.
            </p>
            <button
              type="button"
              className="rs-btn rs-btn-secondary"
              onClick={() => setStatus('idle')}
            >
              Use a different email
            </button>
          </>
        ) : (
          <>
            <p className="rs-auth-sub">
              Enter your email and we'll send a one-time sign-in link. No password to remember.
            </p>
            <form className="rs-auth-form" onSubmit={onSubmit}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="rs-btn rs-btn-primary"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
              </button>
            </form>
            {status === 'error' && <p className="rs-auth-note rs-auth-error">{error}</p>}
            <p className="rs-auth-note">
              Your shelf is private. Each account can only ever see its own books.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
