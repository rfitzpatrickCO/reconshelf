import { useState } from 'react'
import Logo from './Logo'
import { randomPhrase } from '../lib/phrases'

/*
 * Full-screen loading state with a random motivational phrase. Used both as a
 * page-level loader (app launch) and as a fixed overlay (e.g. while logging
 * reading). The phrase is picked once on mount so it stays steady while shown.
 */
export default function LoadingScreen({ phrase }) {
  const [line] = useState(() => phrase || randomPhrase())
  return (
    <div className="rs-loading">
      <Logo size={36} showText={false} />
      <p className="rs-loading-quote">&ldquo;{line}&rdquo;</p>
      <div className="rs-loading-bar">
        <span />
      </div>
    </div>
  )
}
