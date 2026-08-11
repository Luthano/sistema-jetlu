import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatCnpj, formatCpf, formatPhone, isProfileComplete, profileInitials } from '../lib/profile'
import './PainelUsuarios.css'

const FILTROS = [
  { id: 'pending', label: 'Pendentes' },
  { id: 'approved', label: 'Aprovados' },
  { id: 'rejected', label: 'Recusados' },
  { id: 'all', label: 'Todos' },
]

function statusMeta(status) {
  if (status === 'approved') return { label: 'Aprovado', className: 'is-ok' }
  if (status === 'rejected') return { label: 'Recusado', className: 'is-danger' }
  return { label: 'Pendente', className: 'is-warn' }
}

function Field({ label, value }) {
  return (
    <div className="user-card-field">
      <dt>{label}</dt>
      <dd className={value ? '' : 'is-empty'}>{value || 'Não informado'}</dd>
    </div>
  )
}

function PainelUsuarios({ masterId, onChanged }) {
  const [usuarios, setUsuarios] = useState([])
  const [filtro, setFiltro] = useState('all')
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(true)
  const [savingId, setSavingId] = useState('')

  async function carregar() {
    setBusy(true)
    setErro('')
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setErro(error.message || 'Não foi possível carregar os usuários.')
      setUsuarios([])
    } else {
      setUsuarios(data || [])
    }
    setBusy(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function atualizarStatus(usuario, status) {
    setSavingId(usuario.id)
    setErro('')
    const { error } = await supabase
      .from('profiles')
      .update({
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        approved_by: status === 'approved' ? masterId : null,
      })
      .eq('id', usuario.id)

    if (error) {
      setErro(error.message || 'Não foi possível atualizar o usuário.')
    } else {
      await carregar()
      onChanged?.()
    }
    setSavingId('')
  }

  const contagens = useMemo(
    () => ({
      all: usuarios.length,
      pending: usuarios.filter((item) => item.status === 'pending').length,
      approved: usuarios.filter((item) => item.status === 'approved').length,
      rejected: usuarios.filter((item) => item.status === 'rejected').length,
    }),
    [usuarios],
  )

  const lista = useMemo(() => {
    const filtrados = filtro === 'all' ? usuarios : usuarios.filter((item) => item.status === filtro)
    return [...filtrados].sort((a, b) => Number(b.role === 'master') - Number(a.role === 'master'))
  }, [usuarios, filtro])

  return (
    <section className="painel-admin">
      <header className="painel-admin-head">
        <div>
          <p>Revise o cadastro e libere o acesso às cotações.</p>
        </div>
      </header>

      <div className="user-filters" role="tablist" aria-label="Filtrar usuários">
        {FILTROS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filtro === item.id}
            className={filtro === item.id ? 'is-active' : ''}
            onClick={() => setFiltro(item.id)}
          >
            {item.label}
            <span>{contagens[item.id]}</span>
          </button>
        ))}
      </div>

      {erro && (
        <p className="auth-alert" role="alert">
          {erro}
        </p>
      )}
      {busy && <p className="user-empty">Carregando usuários…</p>}

      {!busy && lista.length === 0 ? (
        <div className="user-empty">
          <strong>Nenhum usuário neste filtro</strong>
          <span>Quando houver cadastros, eles aparecem aqui para revisão.</span>
        </div>
      ) : (
        <ul className="user-cards">
          {lista.map((usuario) => {
            const completo = isProfileComplete(usuario)
            const status = statusMeta(usuario.status)
            const isMasterAccount = usuario.role === 'master'
            const titulo = usuario.nome_completo || usuario.email

            return (
              <li key={usuario.id} className="user-card">
                <header className="user-card-head">
                  <div className="user-card-identity">
                    <span className="user-card-avatar" aria-hidden="true">
                      {profileInitials(usuario)}
                    </span>
                    <div>
                      <h3>{titulo}</h3>
                      {usuario.nome_completo ? <p>{usuario.email}</p> : null}
                    </div>
                  </div>
                  <div className="user-card-badges">
                    <span className={`user-badge ${status.className}`}>{status.label}</span>
                    {isMasterAccount ? <span className="user-badge is-role">Master</span> : null}
                    <span className={`user-badge ${completo ? 'is-ok' : 'is-warn'}`}>
                      {completo ? 'Dados completos' : 'Dados incompletos'}
                    </span>
                  </div>
                </header>

                <dl className="user-card-grid">
                  <Field label="Endereço" value={usuario.endereco} />
                  <Field label="CPF" value={formatCpf(usuario.cpf)} />
                  <Field label="CNPJ" value={formatCnpj(usuario.cnpj)} />
                  <Field label="Telefone da conta" value={formatPhone(usuario.telefone)} />
                  <Field label="WhatsApp" value={formatPhone(usuario.whatsapp)} />
                </dl>

                {isMasterAccount ? (
                  <p className="user-card-note">Conta master — sem ação de aprovação.</p>
                ) : (
                  <footer className="user-card-footer">
                    {!completo && usuario.status !== 'rejected' ? (
                      <p>Este usuário ainda não concluiu o cadastro.</p>
                    ) : (
                      <p>Confira os dados antes de liberar as cotações.</p>
                    )}
                    <div className="user-card-actions">
                      <button
                        type="button"
                        className="is-approve"
                        disabled={savingId === usuario.id || usuario.status === 'approved' || !completo}
                        onClick={() => atualizarStatus(usuario, 'approved')}
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        className="is-reject"
                        disabled={savingId === usuario.id || usuario.status === 'rejected'}
                        onClick={() => atualizarStatus(usuario, 'rejected')}
                      >
                        Recusar
                      </button>
                    </div>
                  </footer>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default PainelUsuarios
