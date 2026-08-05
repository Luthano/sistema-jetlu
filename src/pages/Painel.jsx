import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import PainelUsuarios from './PainelUsuarios'
import PainelCadastro from './PainelCadastro'
import './AuthPages.css'
import './Painel.css'

function formatMoney(value) {
  const num = Number(value)
  if (Number.isNaN(num) || value == null || value === '') return '—'
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

function Painel() {
  const { user, loading, signOut, isMaster, isApproved, isPending, isRejected, canUseCotacao, profile, profileComplete, refreshProfile } = useAuth()
  const location = useLocation()
  const [cotacoesCount, setCotacoesCount] = useState(0)
  const [coletasCount, setColetasCount] = useState(0)
  const [ultimaCotacao, setUltimaCotacao] = useState(null)
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    if (!user || !isApproved) return undefined

    let active = true
    setBusy(true)
    setErro('')

    Promise.all([
      supabase.from('cotacoes').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(1),
      supabase.from('coletas').select('id', { count: 'exact', head: true }),
    ])
      .then(([cotacaoRes, coletaRes]) => {
        if (!active) return
        if (cotacaoRes.error) throw cotacaoRes.error
        if (coletaRes.error) throw coletaRes.error
        setCotacoesCount(cotacaoRes.count || 0)
        setColetasCount(coletaRes.count || 0)
        setUltimaCotacao(cotacaoRes.data?.[0] || null)
      })
      .catch((error) => {
        if (active) setErro(error.message || 'Não foi possível carregar o painel.')
      })
      .finally(() => {
        if (active) setBusy(false)
      })

    return () => {
      active = false
    }
  }, [user, isApproved])

  const resumo = useMemo(
    () => ({
      cotacoes: cotacoesCount,
      coletas: coletasCount,
      ultimoFrete: ultimaCotacao?.total_frete,
      ultimaData: ultimaCotacao?.created_at,
    }),
    [cotacoesCount, coletasCount, ultimaCotacao],
  )

  if (!loading && !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <div className="auth-page painel-page">
      <div className="painel-wrap">
        <header className="painel-head">
          <div>
            <p className="auth-kicker">{isMaster ? 'Painel master' : 'Painel do cliente'}</p>
            <h1>Olá, bem-vindo</h1>
          </div>
          <button type="button" className="painel-sair" onClick={() => signOut()}>
            Sair da conta
          </button>
        </header>

        {isRejected && (
          <p className="auth-alert" role="alert">
            Sua conta foi recusada. Fale com o administrador Jetlu.
          </p>
        )}

        {!isRejected && profile && (
          <PainelCadastro profile={profile} canDelete={!isMaster} onSaved={refreshProfile} />
        )}

        {isPending && profileComplete && (
          <p className="auth-info">Dados enviados. Aguarde a aprovação do master para usar as cotações.</p>
        )}

        {isMaster && <PainelUsuarios masterId={user.id} />}

        {!isRejected && (
          <section className="painel-cards" aria-label="Atalhos e resumo">
            {canUseCotacao ? (
              <Link to="/cotacao" className="painel-card is-action is-primary">
                <strong>Nova cotação</strong>
                <span>Calcular frete e gravar no SSW</span>
              </Link>
            ) : (
              <div className="painel-card is-action">
                <strong>Nova cotação</strong>
                <span>
                  {profileComplete
                    ? 'Aguarde a aprovação do master para cotar.'
                    : 'Preencha seus dados cadastrais para liberar as cotações.'}
                </span>
              </div>
            )}
            <Link to="/rastrear" className="painel-card is-action">
              <strong>Rastrear</strong>
              <span>Acompanhar encomenda</span>
            </Link>
            <Link to="/cidades-atendidas" className="painel-card is-action">
              <strong>Cidades</strong>
              <span>Consultar cobertura Jetlu</span>
            </Link>

            {isApproved ? (
              <>
                <article className="painel-card is-stat">
                  <span>Cotações</span>
                  <strong>{busy ? '…' : resumo.cotacoes}</strong>
                  <small>Total na conta</small>
                </article>
                <article className="painel-card is-stat">
                  <span>Coletas</span>
                  <strong>{busy ? '…' : resumo.coletas}</strong>
                  <small>Total na conta</small>
                </article>
                <article className="painel-card is-stat">
                  <span>Último frete</span>
                  <strong>{busy ? '…' : formatMoney(resumo.ultimoFrete)}</strong>
                  <small>{resumo.ultimaData ? formatDate(resumo.ultimaData) : 'Sem registros'}</small>
                </article>
              </>
            ) : null}
          </section>
        )}

        {erro && (
          <p className="auth-alert" role="alert">
            {erro}
          </p>
        )}
      </div>
    </div>
  )
}

export default Painel
