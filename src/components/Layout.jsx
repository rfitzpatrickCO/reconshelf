import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'
import { useAuth } from '../auth/AuthContext'

const NAV = [
  { to: '/', label: 'The reading list', icon: 'shelf', end: true },
  { to: '/shelf/all', label: 'Library', icon: 'library', end: false },
  { to: `/recap/${new Date().getFullYear()}`, label: 'After-action', icon: 'recap', end: false },
  { to: '/commendations', label: 'Commendations', icon: 'star', end: false },
  { to: '/profile', label: 'Profile', icon: 'user', end: false },
]

const TABS = [
  { to: '/', label: 'Reading', icon: 'shelf', end: true },
  { to: '/shelf/all', label: 'Library', icon: 'library', end: false },
  { to: '/book/new', label: 'Add', icon: 'plus', end: false },
  { to: '/profile', label: 'Profile', icon: 'user', end: false },
]

function initials(email) {
  if (!email) return '··'
  return email.slice(0, 2).toUpperCase()
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="rs-shell">
      {/* ---- desktop sidebar ---- */}
      <aside className="rs-sidebar">
        <div className="rs-sidebar-brand">
          <Logo />
        </div>

        <nav className="rs-nav">
          <p className="rs-sidebar-eyebrow">Navigation</p>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `rs-nav-link ${isActive ? 'is-active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="rs-btn rs-btn-primary" onClick={() => navigate('/book/new')}>
          <Icon name="plus" size={16} />
          Add to shelf
        </button>

        <div className="rs-sidebar-foot">
          <div className="rs-account">
            <div className="rs-avatar">{initials(user?.email)}</div>
            <span className="rs-account-email">{user?.email}</span>
          </div>
          <button className="rs-signout" onClick={signOut}>
            Stand down (sign out)
          </button>
        </div>
      </aside>

      {/* ---- main column ---- */}
      <div className="rs-main">
        {/* mobile top bar */}
        <header className="rs-topbar">
          <Logo />
          <div className="rs-header-icons">
            <button
              className="rs-back"
              onClick={() => navigate('/shelf/all')}
              aria-label="Search the shelf"
            >
              <Icon name="search" size={20} />
            </button>
            <button
              className="rs-back"
              onClick={() => navigate('/profile')}
              aria-label="Profile"
            >
              <Icon name="user" size={20} />
            </button>
          </div>
        </header>

        <main className="rs-content">
          <Outlet />
        </main>

        {/* mobile bottom tab bar */}
        <nav className="rs-tabbar">
          <div className="rs-tabbar-inner">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) => `rs-tab ${isActive ? 'is-active' : ''}`}
              >
                <Icon name={tab.icon} size={20} />
                {tab.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
