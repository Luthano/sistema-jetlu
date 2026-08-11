import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { UFS_BRASIL } from '../lib/ufsAtendidas'
import './PainelCidadesAdmin.css'

function normalizeCityLine(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
}

function formatCityName(name) {
  return String(name)
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s(/-])(\p{L})/gu, (_, sep, letter) => sep + letter.toLocaleUpperCase('pt-BR'))
}

function PainelCidadesAdmin() {
  const [carriers, setCarriers] = useState([])
  const [carrierId, setCarrierId] = useState('')
  const [uf, setUf] = useState('PR')
  const [cidades, setCidades] = useState([])
  const [lote, setLote] = useState('')
  const [novaCidade, setNovaCidade] = useState('')
  const [filtro, setFiltro] = useState('')
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)

  const [editId, setEditId] = useState('')
  const [editNome, setEditNome] = useState('')
  const [confirmLimparUf, setConfirmLimparUf] = useState(false)
  const [novaTransportadora, setNovaTransportadora] = useState({
    id: '',
    nome: '',
    sigla: '',
  })

  const carrier = useMemo(
    () => carriers.find((item) => item.id === carrierId) || null,
    [carriers, carrierId],
  )

  const cidadesFiltradas = useMemo(() => {
    const termo = filtro.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return cidades
    return cidades.filter((item) => item.cidade.toLocaleLowerCase('pt-BR').includes(termo))
  }, [cidades, filtro])

  const carregarCarriers = useCallback(async () => {
    const { data, error } = await supabase
      .from('transportadoras_cobertura')
      .select('id, nome, sigla, ativo, ordem')
      .order('ordem', { ascending: true })

    if (error) throw error
    setCarriers(data || [])
    setCarrierId((prev) => {
      if (prev && (data || []).some((item) => item.id === prev)) return prev
      return data?.[0]?.id || ''
    })
  }, [])

  const carregarCidades = useCallback(async () => {
    if (!carrierId || !uf) {
      setCidades([])
      return
    }

    const { data, error } = await supabase
      .from('cobertura_cidades')
      .select('id, cidade, uf, transportadora_id')
      .eq('transportadora_id', carrierId)
      .eq('uf', uf)
      .order('cidade', { ascending: true })

    if (error) throw error
    setCidades(data || [])
  }, [carrierId, uf])

  async function recarregar() {
    setBusy(true)
    setErro('')
    try {
      await carregarCarriers()
      await carregarCidades()
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar a cobertura.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    recarregar()
  }, [])

  useEffect(() => {
    if (!carrierId) return
    setBusy(true)
    setErro('')
    setEditId('')
    setEditNome('')
    setConfirmLimparUf(false)
    carregarCidades()
      .catch((error) => setErro(error.message || 'Erro ao carregar cidades.'))
      .finally(() => setBusy(false))
  }, [carrierId, uf, carregarCidades])

  function abrirEdicao(item) {
    setEditId(item.id)
    setEditNome(item.cidade)
    setErro('')
    setInfo('')
  }

  function fecharEdicao() {
    setEditId('')
    setEditNome('')
  }

  async function salvarEdicao(event) {
    event.preventDefault()
    const cidade = normalizeCityLine(editNome)
    if (!editId) return
    if (cidade.length < 2) {
      setErro('Informe o nome da cidade.')
      return
    }

    setSaving(true)
    setErro('')
    setInfo('')
    const { error } = await supabase.from('cobertura_cidades').update({ cidade }).eq('id', editId)
    if (error) {
      setErro(error.message || 'Não foi possível salvar a edição.')
    } else {
      setInfo(`Cidade atualizada para ${formatCityName(cidade)}.`)
      fecharEdicao()
      await carregarCidades()
    }
    setSaving(false)
  }

  async function adicionarCidades(nomes) {
    const limpos = [...new Set(nomes.map(normalizeCityLine).filter((item) => item.length >= 2))]
    if (!carrierId || !uf) {
      setErro('Selecione a transportadora e a UF.')
      return
    }
    if (!limpos.length) {
      setErro('Informe ao menos uma cidade.')
      return
    }

    setSaving(true)
    setErro('')
    setInfo('')

    const rows = limpos.map((cidade) => ({
      transportadora_id: carrierId,
      uf,
      cidade,
    }))

    const { error } = await supabase.from('cobertura_cidades').upsert(rows, {
      onConflict: 'transportadora_id,uf,cidade_norm',
      ignoreDuplicates: false,
    })

    if (error) {
      setErro(error.message || 'Não foi possível salvar as cidades.')
    } else {
      setInfo(`${limpos.length} cidade(s) salva(s) em ${uf} · ${carrier?.sigla || carrierId}.`)
      setLote('')
      setNovaCidade('')
      await carregarCidades()
    }
    setSaving(false)
  }

  async function handleAddUma(event) {
    event.preventDefault()
    await adicionarCidades([novaCidade])
  }

  async function handleAddLote(event) {
    event.preventDefault()
    const nomes = lote.split(/\r?\n|;|,/).map((item) => item.trim())
    await adicionarCidades(nomes)
  }

  async function removerCidade(id) {
    if (!window.confirm('Remover esta cidade da cobertura?')) return
    setSaving(true)
    setErro('')
    const { error } = await supabase.from('cobertura_cidades').delete().eq('id', id)
    if (error) setErro(error.message || 'Não foi possível remover.')
    else {
      if (editId === id) fecharEdicao()
      await carregarCidades()
    }
    setSaving(false)
  }

  function pedirConfirmacaoLimparUf() {
    if (!carrierId || !uf || !cidades.length || saving) return
    setConfirmLimparUf(true)
  }

  async function confirmarLimparUf() {
    if (!carrierId || !uf) return
    setConfirmLimparUf(false)
    setSaving(true)
    setErro('')
    setInfo('')
    const { error } = await supabase
      .from('cobertura_cidades')
      .delete()
      .eq('transportadora_id', carrierId)
      .eq('uf', uf)
    if (error) setErro(error.message || 'Não foi possível limpar a UF.')
    else {
      setInfo(`Cobertura de ${uf} limpa para ${carrier?.nome || carrierId}.`)
      fecharEdicao()
      await carregarCidades()
    }
    setSaving(false)
  }

  async function salvarTransportadora(event) {
    event.preventDefault()
    const id = String(novaTransportadora.id || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
    const nome = String(novaTransportadora.nome || '').trim()
    const sigla = String(novaTransportadora.sigla || '').trim().toUpperCase()

    if (!id || !nome || !sigla) {
      setErro('Preencha id, nome e sigla da transportadora.')
      return
    }

    setSaving(true)
    setErro('')
    const { error } = await supabase.from('transportadoras_cobertura').upsert(
      {
        id,
        nome,
        sigla,
        ativo: true,
        ordem: carriers.length + 1,
      },
      { onConflict: 'id' },
    )

    if (error) {
      setErro(error.message || 'Não foi possível salvar a transportadora.')
    } else {
      setInfo(`Transportadora ${nome} (${sigla}) disponível.`)
      setNovaTransportadora({ id: '', nome: '', sigla: '' })
      await carregarCarriers()
      setCarrierId(id)
    }
    setSaving(false)
  }

  return (
    <section className="painel-admin cob-admin">
      {erro && (
        <p className="auth-alert" role="alert">
          {erro}
        </p>
      )}
      {info && <p className="auth-info">{info}</p>}

      <div className="cob-toolbar">
        <label>
          <span>Transportadora</span>
          <select value={carrierId} onChange={(e) => setCarrierId(e.target.value)} disabled={busy || !carriers.length}>
            {!carriers.length && <option value="">Nenhuma cadastrada</option>}
            {carriers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome} ({item.sigla})
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>UF</span>
          <select value={uf} onChange={(e) => setUf(e.target.value)} disabled={busy}>
            {UFS_BRASIL.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="cob-filter">
          <span>Filtrar lista</span>
          <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar cidade" />
        </label>
      </div>

      <div className="cob-grid">
        <form className="cob-card" onSubmit={handleAddUma}>
          <h3>Adicionar cidade</h3>
          <p className="cob-hint">
            Em {uf} · {carrier ? `${carrier.nome} (${carrier.sigla})` : '—'}
          </p>
          <input
            value={novaCidade}
            onChange={(e) => setNovaCidade(e.target.value)}
            placeholder="Ex.: Cascavel"
            disabled={saving || !carrierId}
          />
          <button type="submit" className="painel-section-cta" disabled={saving || !carrierId}>
            Salvar cidade
          </button>
        </form>

        <form className="cob-card" onSubmit={handleAddLote}>
          <h3>Importar em lote</h3>
          <p className="cob-hint">Uma cidade por linha (ou separadas por vírgula).</p>
          <textarea
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            rows={8}
            placeholder={'Cascavel\nMaringa\nLondrina'}
            disabled={saving || !carrierId}
          />
          <button type="submit" className="painel-section-cta" disabled={saving || !carrierId}>
            Importar lista
          </button>
        </form>

        <form className="cob-card" onSubmit={salvarTransportadora}>
          <h3>Nova transportadora</h3>
          <p className="cob-hint">Para parceiras futuras (id único, nome e sigla na lista pública).</p>
          <div className="cob-carrier-fields">
            <input
              value={novaTransportadora.id}
              onChange={(e) => setNovaTransportadora((prev) => ({ ...prev, id: e.target.value }))}
              placeholder="id (ex.: envia)"
              disabled={saving}
            />
            <input
              value={novaTransportadora.nome}
              onChange={(e) => setNovaTransportadora((prev) => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome"
              disabled={saving}
            />
            <input
              value={novaTransportadora.sigla}
              onChange={(e) => setNovaTransportadora((prev) => ({ ...prev, sigla: e.target.value }))}
              placeholder="Sigla (ex.: ER)"
              maxLength={6}
              disabled={saving}
            />
          </div>
          <button type="submit" className="painel-section-cta is-ghost" disabled={saving}>
            Cadastrar transportadora
          </button>
        </form>
      </div>

      <div className="cob-list-head">
        <div>
          <strong>
            {cidadesFiltradas.length} cidade(s) em {uf}
          </strong>
          <span>{carrier ? `${carrier.nome} · ${carrier.sigla}` : ''}</span>
        </div>
        <button
          type="button"
          className="painel-section-cta cob-btn-compact"
          onClick={pedirConfirmacaoLimparUf}
          disabled={saving || !cidades.length}
        >
          Limpar UF
        </button>
      </div>

      {confirmLimparUf && (
        <div
          className="cob-confirm-backdrop"
          role="presentation"
          onClick={() => !saving && setConfirmLimparUf(false)}
        >
          <div
            className="cob-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cob-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="cob-confirm-title">Limpar cobertura desta UF?</h3>
            <p>
              Isso remove <strong>todas as {cidades.length} cidade(s)</strong> de{' '}
              <strong>{uf}</strong> em{' '}
              <strong>{carrier ? `${carrier.nome} (${carrier.sigla})` : 'esta transportadora'}</strong>.
              A ação não pode ser desfeita pelo painel.
            </p>
            <div className="cob-confirm-actions">
              <button
                type="button"
                className="painel-section-cta is-ghost cob-btn-compact"
                onClick={() => setConfirmLimparUf(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="painel-section-cta cob-btn-compact"
                onClick={confirmarLimparUf}
                disabled={saving}
              >
                Sim, limpar UF
              </button>
            </div>
          </div>
        </div>
      )}

      {busy ? (
        <p className="painel-muted">Carregando…</p>
      ) : cidadesFiltradas.length === 0 ? (
        <p className="painel-muted">Nenhuma cidade nesta UF para a transportadora selecionada.</p>
      ) : (
        <ul className="cob-lista">
          {cidadesFiltradas.map((item) => {
            const editando = editId === item.id
            return (
              <li key={item.id} className={editando ? 'is-editing' : ''}>
                {editando ? (
                  <form className="cob-edit-form" onSubmit={salvarEdicao}>
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      disabled={saving}
                      autoFocus
                      aria-label="Nome da cidade"
                    />
                    <div className="cob-edit-actions">
                      <button type="submit" className="painel-section-cta cob-btn-compact" disabled={saving}>
                        Salvar
                      </button>
                      <button
                        type="button"
                        className="painel-section-cta is-ghost cob-btn-compact"
                        onClick={fecharEdicao}
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="painel-section-cta cob-btn-compact"
                        onClick={() => removerCidade(item.id)}
                        disabled={saving}
                      >
                        Remover
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span>{formatCityName(item.cidade)}</span>
                    <button type="button" className="cob-edit-open" onClick={() => abrirEdicao(item)} disabled={saving}>
                      Editar
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default PainelCidadesAdmin
