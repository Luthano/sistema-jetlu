import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Cotacao from './pages/Cotacao'
import Rastrear from './pages/Rastrear'
import CidadesAtendidas from './pages/CidadesAtendidas'
import Login from './pages/Login'
import Historico from './pages/Historico'
import './App.css'

const TABS = [
  { to: '/', label: 'Home' },
  { to: '/cotacao', label: 'Cotação' },
  { to: '/rastrear', label: 'Rastrear' },
  { to: '/cidades-atendidas', label: 'Cidades atendidas' },
  { to: '/historico', label: 'Histórico' },
]

function isTabActive(pathname, to) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function AuthNav() {
  const { user, loading, signOut } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <Link to="/login" className="auth-nav-link">
        Entrar
      </Link>
    )
  }

  return (
    <div className="auth-nav">
      <span className="auth-nav-email" title={user.email}>
        {user.email}
      </span>
      <button type="button" className="auth-nav-link" onClick={() => signOut()}>
        Sair
      </button>
    </div>
  )
}

function AppHeader({ scrolled }) {
  const { pathname } = useLocation()

  return (
    <header className={`app-header ${scrolled ? 'is-scrolled' : ''}`}>
      <Link to="/" className="app-brand">
        <img className="app-brand-logo" src="/home/logo-jetlu.svg" alt="Jetlu" />
      </Link>
      <nav className="tabs" aria-label="Navegação principal">
        {TABS.map((tab) => {
          const active = isTabActive(pathname, tab.to)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={active ? 'tab is-active' : 'tab'}
              aria-current={active ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <AuthNav />
    </header>
  )
}

function AppShell() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="app-shell">
      <AppHeader scrolled={scrolled} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rastrear" element={<Rastrear />} />
          <Route path="/cotacao" element={<Cotacao />} />
          <Route path="/cidades-atendidas" element={<CidadesAtendidas />} />
          <Route path="/login" element={<Login />} />
          <Route path="/historico" element={<Historico />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
