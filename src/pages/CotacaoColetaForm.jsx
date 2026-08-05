import { useMemo, useState } from 'react'

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function toDatetimeLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultLimiteColeta() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(18, 0, 0, 0)
  return toDatetimeLocal(date)
}

function defaultTipoPagamento(quoteForm) {
  const pagador = onlyDigits(quoteForm.cnpjPagador)
  const destinatario = onlyDigits(quoteForm.cnpjDestinatario)

  if (pagador && destinatario && pagador === destinatario) return 'D'
  return 'O'
}

function CotacaoColetaForm({ quoteForm, totais, locked, numeroColeta, onSuccess }) {
  const bounds = useMemo(() => {
    const min = new Date()
    const max = new Date()
    max.setDate(max.getDate() + 15)
    return { min: toDatetimeLocal(min), max: toDatetimeLocal(max) }
  }, [])

  const [coleta, setColeta] = useState(() => ({
    solicitante: '',
    limiteColeta: defaultLimiteColeta(),
    tipoPagamento: defaultTipoPagamento(quoteForm),
    numeroNF: '',
    logradouroEndColeta: '',
    numeroEndColeta: '',
    complementoEndColeta: '',
    bairroEndColeta: '',
    observacao: '',
  }))
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function updateField(field, value) {
    setColeta((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSolicitar() {
    if (locked || loading) return

    const solicitante = coleta.solicitante.trim()
    if (!solicitante) {
      setErro('Informe o nome do solicitante.')
      return
    }
    if (!coleta.limiteColeta) {
      setErro('Informe a data e hora limite da coleta.')
      return
    }
    if (!totais.peso || totais.peso <= 0) {
      setErro('A coleta no SSW exige peso maior que zero.')
      return
    }

    const confirmed = window.confirm(
      'Isso gera uma coleta real no SSW e não é um rascunho. Deseja continuar?',
    )
    if (!confirmed) return

    setErro('')
    setLoading(true)

    try {
      const res = await fetch('/api/coleta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitante,
          tipoPagamento: coleta.tipoPagamento,
          limiteColeta: coleta.limiteColeta,
          numeroNF: coleta.numeroNF.trim(),
          observacao: coleta.observacao.trim(),
          logradouroEndColeta: coleta.logradouroEndColeta.trim(),
          numeroEndColeta: coleta.numeroEndColeta.trim(),
          complementoEndColeta: coleta.complementoEndColeta.trim(),
          bairroEndColeta: coleta.bairroEndColeta.trim(),
          cnpjPagador: quoteForm.cnpjPagador,
          cnpjRemetente: quoteForm.cnpjRemetente,
          cnpjDestinatario: quoteForm.cnpjDestinatario,
          cnpjSolicitante: quoteForm.cnpjPagador,
          cepEndColeta: quoteForm.cepOrigem,
          cepEntrega: quoteForm.cepDestino,
          quantidade: totais.quantidade,
          peso: totais.peso,
          cubagem: totais.volume,
          valorMerc: quoteForm.valorNF ? Number(quoteForm.valorNF) : undefined,
        }),
      })

      const data = await res.json()
      if (!data.sucesso) {
        setErro(data.mensagem || 'Não foi possível gerar a coleta no SSW.')
        return
      }

      onSuccess({
        numeroColeta: data.numeroColeta,
        mensagem: data.mensagem,
      })
    } catch (error) {
      setErro(error.message || 'Erro de comunicação com a API de coleta.')
    } finally {
      setLoading(false)
    }
  }

  const bloqueado = locked || loading

  return (
    <div className="coleta-form" id="formulario-coleta">
      <div className="section-heading">
        <span className="section-step">C</span>
        <div>
          <h2>Solicitar coleta</h2>
        </div>
      </div>

      {numeroColeta ? (
        <div className="coleta-sucesso" role="status">
          <p>Coleta gerada com sucesso</p>
          <strong>{numeroColeta}</strong>
        </div>
      ) : (
        <div className="fields-grid">
          <label className="field field-span-2">
            <span>Nome do solicitante *</span>
            <input
              value={coleta.solicitante}
              onChange={(e) => updateField('solicitante', e.target.value)}
              placeholder="Quem está pedindo a coleta"
              disabled={bloqueado}
            />
          </label>
          <label className="field">
            <span>Data e hora limite *</span>
            <input
              type="datetime-local"
              min={bounds.min}
              max={bounds.max}
              value={coleta.limiteColeta}
              onChange={(e) => updateField('limiteColeta', e.target.value)}
              disabled={bloqueado}
            />
          </label>
          <label className="field">
            <span>Tipo de pagamento *</span>
            <select
              value={coleta.tipoPagamento}
              onChange={(e) => updateField('tipoPagamento', e.target.value)}
              disabled={bloqueado}
            >
              <option value="O">Na origem</option>
              <option value="D">No destino</option>
            </select>
          </label>
          <label className="field">
            <span>Número da NF</span>
            <input
              value={coleta.numeroNF}
              onChange={(e) => updateField('numeroNF', e.target.value)}
              placeholder="Opcional, mas ajuda a operação"
              disabled={bloqueado}
            />
          </label>
          <label className="field">
            <span>Logradouro da coleta</span>
            <input
              value={coleta.logradouroEndColeta}
              onChange={(e) => updateField('logradouroEndColeta', e.target.value)}
              placeholder="Rua / avenida"
              disabled={bloqueado}
            />
          </label>
          <label className="field">
            <span>Número</span>
            <input
              value={coleta.numeroEndColeta}
              onChange={(e) => updateField('numeroEndColeta', e.target.value)}
              placeholder="Nº"
              disabled={bloqueado}
            />
          </label>
          <label className="field">
            <span>Complemento</span>
            <input
              value={coleta.complementoEndColeta}
              onChange={(e) => updateField('complementoEndColeta', e.target.value)}
              disabled={bloqueado}
            />
          </label>
          <label className="field">
            <span>Bairro</span>
            <input
              value={coleta.bairroEndColeta}
              onChange={(e) => updateField('bairroEndColeta', e.target.value)}
              disabled={bloqueado}
            />
          </label>
          <label className="field field-span-2">
            <span>Observação</span>
            <input
              maxLength={80}
              value={coleta.observacao}
              onChange={(e) => updateField('observacao', e.target.value)}
              placeholder="Até 80 caracteres"
              disabled={bloqueado}
            />
          </label>
        </div>
      )}

      {erro && (
        <p className="cotacao-msg erro" role="alert">
          {erro}
        </p>
      )}

      <button
        type="button"
        className={`btn-primary btn-coleta ${locked ? 'is-locked' : ''}`}
        onClick={handleSolicitar}
        disabled={bloqueado}
      >
        {locked ? 'Coleta já gerada' : loading ? 'Gerando coleta…' : 'Solicitar coleta'}
      </button>
    </div>
  )
}

export default CotacaoColetaForm
