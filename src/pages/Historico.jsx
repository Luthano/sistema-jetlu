import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './AuthPages.css'

function formatMoney(value) {
  const num = Number(value)
  if (Number.isNaN(num) || value == null || value === '') return '—'
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

function Historico() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [cotacoes, setCotacoes] = useState([])
  const [coletas, setColetas] = useState([])
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    if (!user) return undefined

    let active = true
    setBusy(true)
    setErro('')

    Promise.all([
      supabase.from('cotacoes').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('coletas').select('*').order('created_at', { ascending: false }).limit(50),
    ])
      .then(([cotacaoRes, coletaRes]) => {
        if (!active) return
        if (cotacaoRes.error) throw cotacaoRes.error
        if (coletaRes.error) throw coletaRes.error
        setCotacoes(cotacaoRes.data || [])
        setColetas(coletaRes.data || [])
      })
      .catch((error) => {
        if (active) setErro(error.message || 'Não foi possível carregar o histórico.')
      })
      .finally(() => {
        if (active) setBusy(false)
      })

    return () => {
      active = false
    }
  }, [user])

  if (!loading && !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <div className="auth-page historico-page">
      <div className="historico-wrap">
        <header className="historico-head">
          <div>
            <p className="auth-kicker">Conta</p>
            <h1>Histórico</h1>
            <p className="auth-copy">{user?.email}</p>
          </div>
          <Link to="/cotacao" className="auth-submit historico-cta">
            Nova cotação
          </Link>
        </header>

        {erro && (
          <p className="auth-alert" role="alert">
            {erro}
          </p>
        )}
        {busy && <p className="auth-copy">Carregando histórico…</p>}

        <section>
          <h2>Cotações</h2>
          {cotacoes.length === 0 && !busy ? (
            <p className="auth-copy">Nenhuma cotação salva ainda.</p>
          ) : (
            <ul className="historico-list">
              {cotacoes.map((item) => (
                <li key={item.id}>
                  <strong>
                    {item.cep_origem || '—'} → {item.cep_destino || '—'}
                  </strong>
                  <span>{formatDate(item.created_at)}</span>
                  <span>{formatMoney(item.total_frete)}</span>
                  <span>{item.prazo ? `${item.prazo} dia(s)` : 'Prazo —'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Coletas</h2>
          {coletas.length === 0 && !busy ? (
            <p className="auth-copy">Nenhuma coleta salva ainda.</p>
          ) : (
            <ul className="historico-list">
              {coletas.map((item) => (
                <li key={item.id}>
                  <strong>{item.numero_coleta || 'Coleta sem número'}</strong>
                  <span>{formatDate(item.created_at)}</span>
                  <span>{item.solicitante || '—'}</span>
                  <span>{item.cep_entrega || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default Historico
