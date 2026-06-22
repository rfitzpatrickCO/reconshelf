import { useState } from 'react'
import { useAuth } from './AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const { signInWithEmail, verifyCode, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [codeError, setCodeError] = useState('')

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

  async function onVerify(e) {
    e.preventDefault()
    const token = code.trim()
    if (token.length < 6) return
    setVerifying(true)
    setCodeError('')
    try {
      // On success, the auth listener swaps this screen for the app automatically.
      await verifyCode(email.trim(), token)
    } catch (err) {
      setCodeError(err.message || 'That code did not work. Check it and try again.')
      setVerifying(false)
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
              Orders sent to <strong>{email}</strong>. Enter the 6-digit code from the email below.
            </p>

            <form className="rs-auth-form" onSubmit={onVerify}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                style={{ letterSpacing: '0.4em', fontSize: 18 }}
                required
                autoFocus
              />
              <button type="submit" className="rs-btn rs-btn-primary" disabled={verifying}>
                {verifying ? 'Verifying…' : 'Sign in'}
              </button>
            </form>
            {codeError && <p className="rs-auth-note rs-auth-error">{codeError}</p>}

            <p className="rs-auth-note">
              On a computer you can also just tap the link in the email. On iPhone, use the code
              above so you stay in the app.
            </p>
            <button
              type="button"
              className="rs-signout"
              style={{ marginTop: 'var(--rs-space-2)' }}
              onClick={() => {
                setStatus('idle')
                setCode('')
                setCodeError('')
              }}
            >
              Use a different email
            </button>
          </>
        ) : (
          <>
            <p className="rs-auth-sub">
              Enter your email and we'll send a one-time code. No password to remember.
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
                {status === 'sending' ? 'Sending…' : 'Send sign-in code'}
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
