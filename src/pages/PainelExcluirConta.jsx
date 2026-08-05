import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function PainelExcluirConta({ email }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [excluindo, setExcluindo] = useState(false)

  async function excluirConta() {
    setErro('')
    if (confirmacao.trim().toLowerCase() !== String(email || '').toLowerCase()) {
      setErro('Digite o e-mail da conta para confirmar a exclusão.')
      return
    }

    setExcluindo(true)
    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
      setErro(error.message || 'Não foi possível excluir a conta.')
      setExcluindo(false)
      return
    }

    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="painel-danger">
      <div>
        <h3>Excluir conta</h3>
        <p>Esta ação apaga seu cadastro, histórico de cotações e o acesso ao sistema. Não dá para desfazer.</p>
      </div>

      {!aberto ? (
        <button type="button" className="painel-danger-btn" onClick={() => setAberto(true)}>
          Excluir minha conta
        </button>
      ) : (
        <div className="painel-danger-confirm">
          <label>
            <span>Digite {email} para confirmar</span>
            <input
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="off"
              placeholder={email}
            />
          </label>
          {erro && (
            <p className="auth-alert" role="alert">
              {erro}
            </p>
          )}
          <div className="painel-cadastro-actions">
            <button type="button" className="painel-danger-btn" disabled={excluindo} onClick={excluirConta}>
              {excluindo ? 'Excluindo…' : 'Excluir permanentemente'}
            </button>
            <button
              type="button"
              className="painel-cancel"
              disabled={excluindo}
              onClick={() => {
                setAberto(false)
                setConfirmacao('')
                setErro('')
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PainelExcluirConta
