import { useState } from 'react'
import { useAuth } from './AuthContext'
import Logo from '../components/Logo'

// Map raw Supabase auth errors to calm, human messages so a rate-limit /
// quota hit degrades gracefully instead of looking broken.
function friendlySendError(err) {
  const msg = (err?.message || '').toLowerCase()
  const status = err?.status
  if (status === 429 || msg.includes('rate limit') || msg.includes('security purposes') || msg.includes('only request')) {
    return 'Too many sign-in requests right now. Give it a few minutes, then try again.'
  }
  if (msg.includes('signups not allowed') || msg.includes('not allowed for otp') || msg.includes('disabled')) {
    return "This email isn't set up for access. Check with whoever invited you."
  }
  if (msg.includes('sending') || status >= 500) {
    return "We're having trouble sending the email right now. Please try again in a few minutes."
  }
  if (msg.includes('valid') && msg.includes('email')) {
    return "That doesn't look like a valid email address."
  }
  return 'Could not send your sign-in code. Please try again in a moment.'
}

function friendlyVerifyError(err) {
  const msg = (err?.message || '').toLowerCase()
  if (err?.status === 429 || msg.includes('rate limit')) {
    return 'Too many attempts. Wait a moment, then try again.'
  }
  if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token')) {
    return 'That code is incorrect or expired. Double-check it, or request a new one.'
  }
  return 'Could not verify that code. Please try again.'
}

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
      setError(friendlySendError(err))
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
      setCodeError(friendlyVerifyError(err))
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
                maxLength={8}
                placeholder="Code from email"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                style={{ letterSpacing: '0.3em', fontSize: 18, textAlign: 'center' }}
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
