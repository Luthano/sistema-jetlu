import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Cotacao from './pages/Cotacao'
import Rastrear from './pages/Rastrear'
import CidadesAtendidas from './pages/CidadesAtendidas'
import './App.css'

const TABS = [
  { to: '/', label: 'Home' },
  { to: '/cotacao', label: 'Cotação' },
  { to: '/rastrear', label: 'Rastrear' },
  { to: '/cidades-atendidas', label: 'Cidades atendidas' },
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
    </header>
  )
}

function App() {
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
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-shell">
        <AppHeader scrolled={scrolled} />


        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rastrear" element={<Rastrear />} />
            <Route path="/cotacao" element={<Cotacao />} />
            <Route path="/cidades-atendidas" element={<CidadesAtendidas />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
