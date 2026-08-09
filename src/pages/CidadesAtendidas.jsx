import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MapaBrasil from '../components/MapaBrasil'
import Reveal from '../components/Reveal'
import {
  buscarCidadesPorUf,
  buscarUfsCobertura,
  cityName,
  citySiglas,
  formatCityName,
  matchCity,
} from './cidadesBusca'
import { UFS_ATENDIDAS } from '../lib/ufsAtendidas'
import './CidadesAtendidas.css'

function cacheUfValido(data) {
  if (!data || !Array.isArray(data.cidades) || !Array.isArray(data.carriers)) return false
  if (data.cidades.length === 0) return true
  const first = data.cidades[0]
  return Boolean(first && typeof first === 'object' && Array.isArray(first.siglas))
}

function intersecaoSiglas(a = [], b = []) {
  const setB = new Set(b)
  return a.filter((sigla) => setB.has(sigla))
}

const ORDEM_COLETA_REDESPACHO = ['ER', 'LS', 'JL']

function nomePorSigla(sigla) {
  if (sigla === 'JL') return 'Jetlu'
  if (sigla === 'LS') return 'Lopesul'
  if (sigla === 'ER') return 'Envia Rápido'
  return sigla
}

function SiglasBadges({ siglas }) {
  if (!siglas?.length) return null
  return (
    <span className="cidades-siglas" aria-label={`Atendida por ${siglas.join(' e ')}`}>
      {siglas.map((sigla) => (
        <span key={sigla} className={`cidades-sigla is-${sigla.toLowerCase()}`} title={nomePorSigla(sigla)}>
          {sigla}
        </span>
      ))}
    </span>
  )
}

/** Coleta em uma transportadora e entrega em outra (redespacho). */
function montarRedespacho(siglasOrigem = [], siglasDestino = []) {
  const destPrefer = siglasDestino.includes('JL') ? 'JL' : siglasDestino[0] || ''
  if (!destPrefer) return null

  const candidatas = siglasOrigem.filter((sigla) => sigla !== destPrefer)
  if (!candidatas.length) return null

  candidatas.sort((a, b) => {
    const ia = ORDEM_COLETA_REDESPACHO.indexOf(a)
    const ib = ORDEM_COLETA_REDESPACHO.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  return {
    coleta: candidatas[0],
    entrega: destPrefer,
  }
}

function CidadesAtendidas() {
  const [ufOrigem, setUfOrigem] = useState('')
  const [cidadeOrigem, setCidadeOrigem] = useState('')
  const [ufDestino, setUfDestino] = useState('')
  const [cidadeDestino, setCidadeDestino] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingLista, setLoadingLista] = useState(false)
  const [erro, setErro] = useState('')
  const [consulta, setConsulta] = useState(null)
  const [cacheUf, setCacheUf] = useState({})
  const [ufsDisponiveis, setUfsDisponiveis] = useState(UFS_ATENDIDAS)
  const [mapaFoco, setMapaFoco] = useState('destino')

  useEffect(() => {
    let cancelled = false
    buscarUfsCobertura()
      .then((ufs) => {
        if (!cancelled && ufs.length) setUfsDisponiveis(ufs)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const sugestoesOrigem = cacheUf[ufOrigem]?.cidades || []
  const sugestoesDestino = cacheUf[ufDestino]?.cidades || []

  const ufLista = mapaFoco === 'origem' ? ufOrigem : ufDestino
  const cidadeListaFiltro = mapaFoco === 'origem' ? cidadeOrigem : cidadeDestino
  const cidadesDaUf = cacheUf[ufLista]?.cidades || []
  const carregandoLista = Boolean(ufLista && !cacheUfValido(cacheUf[ufLista]) && loadingLista)

  const cidadesFiltradas = useMemo(() => {
    const termo = String(cidadeListaFiltro || '').trim().toLocaleLowerCase('pt-BR')
    if (!termo) return cidadesDaUf
    return cidadesDaUf.filter((item) => cityName(item).toLocaleLowerCase('pt-BR').includes(termo))
  }, [cidadesDaUf, cidadeListaFiltro])

  const ufsSelect = useMemo(() => {
    const base = ufsDisponiveis.length ? ufsDisponiveis : UFS_ATENDIDAS
    return base
  }, [ufsDisponiveis])

  async function carregarUf(proximaUf, { comLoadingLista = false } = {}) {
    if (!proximaUf) return null
    const cached = cacheUf[proximaUf]
    if (cacheUfValido(cached)) return cached

    if (comLoadingLista) setLoadingLista(true)
    try {
      const data = await buscarCidadesPorUf(proximaUf)
      setCacheUf((prev) => ({ ...prev, [proximaUf]: data }))
      return data
    } finally {
      if (comLoadingLista) setLoadingLista(false)
    }
  }

  async function pesquisar({ mostrarLoading = true } = {}) {
    const origemUf = ufOrigem
    const destinoUf = ufDestino
    const origemNome = String(cidadeOrigem || '').trim()
    const destinoNome = String(cidadeDestino || '').trim()

    if (!origemUf || !origemNome || !destinoUf || !destinoNome) {
      setErro('Informe UF e cidade de saída e de destino.')
      return
    }

    setErro('')
    if (mostrarLoading) setLoading(true)

    try {
      const [dataOrigem, dataDestino] = await Promise.all([
        carregarUf(origemUf),
        carregarUf(destinoUf),
      ])

      const origemMatch = matchCity(origemNome, dataOrigem?.cidades || [])
      const destinoMatch = matchCity(destinoNome, dataDestino?.cidades || [])

      const siglasOrigem = origemMatch ? citySiglas(origemMatch) : []
      const siglasDestino = destinoMatch ? citySiglas(destinoMatch) : []
      const siglasDiretas = intersecaoSiglas(siglasOrigem, siglasDestino)

      let tipo = 'nao'
      if (origemMatch && destinoMatch && siglasDiretas.length) {
        tipo = 'direta'
      } else if (origemMatch && destinoMatch && montarRedespacho(siglasOrigem, siglasDestino)) {
        tipo = 'redespacho'
      }

      setConsulta({
        tipo,
        atendida: tipo !== 'nao',
        origem: {
          uf: origemUf,
          cidade: origemMatch ? cityName(origemMatch) : origemNome,
          encontrada: Boolean(origemMatch),
        },
        destino: {
          uf: destinoUf,
          cidade: destinoMatch ? cityName(destinoMatch) : destinoNome,
          encontrada: Boolean(destinoMatch),
        },
      })

      requestAnimationFrame(() => {
        document.getElementById('cidades-resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (error) {
      setConsulta(null)
      setErro(error.message || 'Erro de comunicação com a API.')
    } finally {
      if (mostrarLoading) setLoading(false)
    }
  }

  async function handlePesquisar(event) {
    event.preventDefault()
    await pesquisar()
  }

  async function handleMapaUf(proximaUf) {
    setErro('')
    setConsulta(null)

    if (mapaFoco === 'origem') {
      setUfOrigem(proximaUf)
      setCidadeOrigem('')
    } else {
      setUfDestino(proximaUf)
      setCidadeDestino('')
    }

    try {
      await carregarUf(proximaUf, { comLoadingLista: true })
      requestAnimationFrame(() => {
        document.getElementById('cidades-lista-uf')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar as cidades da UF.')
    }
  }

  function escolherCidadeLista(nome) {
    const formatado = formatCityName(nome)
    if (mapaFoco === 'origem') setCidadeOrigem(formatado)
    else setCidadeDestino(formatado)
  }

  const selectedMapUf = mapaFoco === 'origem' ? ufOrigem : ufDestino

  const statusClass =
    consulta?.tipo === 'direta'
      ? 'is-ok'
      : consulta?.tipo === 'redespacho'
        ? 'is-redespacho'
        : 'is-no'

  const statusTitulo =
    consulta?.tipo === 'direta'
      ? 'Rota atendida'
      : consulta?.tipo === 'redespacho'
        ? 'Rota com redespacho'
        : 'Rota não atendida'

  return (
    <div className="page-shell">
      <div className="page-block cidades-page">
        <section className="cidades-map">
          <div className="cidades-wrap cidades-map-grid">
            <Reveal className="cidades-map-copy">
              <h1>A logística acelerada que faz acontecer.</h1>
              <p className="cidades-map-label">Consulte a rota atendida:</p>
              <form className="cidades-map-search cidades-map-search-rota" onSubmit={handlePesquisar}>
                <fieldset className="cidades-rota-group">
                  <legend>Saída</legend>
                  <div className="cidades-rota-fields">
                    <label>
                      <span>UF</span>
                      <select
                        value={ufOrigem}
                        onFocus={() => setMapaFoco('origem')}
                        onChange={(e) => {
                          setUfOrigem(e.target.value)
                          setConsulta(null)
                          setMapaFoco('origem')
                          if (e.target.value) carregarUf(e.target.value, { comLoadingLista: true }).catch(() => {})
                        }}
                      >
                        <option value="">UF</option>
                        {ufsSelect.map((item) => (
                          <option key={`o-${item}`} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="cidades-field-wide">
                      <span>Cidade de saída</span>
                      <input
                        value={cidadeOrigem}
                        onFocus={() => setMapaFoco('origem')}
                        onChange={(e) => setCidadeOrigem(e.target.value)}
                        placeholder="Cidade de origem"
                        list="cidades-sugestoes-origem"
                      />
                      <datalist id="cidades-sugestoes-origem">
                        {sugestoesOrigem.slice(0, 40).map((item) => {
                          const nome = cityName(item)
                          return <option key={`o-${nome}`} value={formatCityName(nome)} />
                        })}
                      </datalist>
                    </label>
                  </div>
                </fieldset>

                <fieldset className="cidades-rota-group">
                  <legend>Destino</legend>
                  <div className="cidades-rota-fields">
                    <label>
                      <span>UF</span>
                      <select
                        value={ufDestino}
                        onFocus={() => setMapaFoco('destino')}
                        onChange={(e) => {
                          setUfDestino(e.target.value)
                          setConsulta(null)
                          setMapaFoco('destino')
                          if (e.target.value) carregarUf(e.target.value, { comLoadingLista: true }).catch(() => {})
                        }}
                      >
                        <option value="">UF</option>
                        {ufsSelect.map((item) => (
                          <option key={`d-${item}`} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="cidades-field-wide">
                      <span>Cidade de destino</span>
                      <input
                        value={cidadeDestino}
                        onFocus={() => setMapaFoco('destino')}
                        onChange={(e) => setCidadeDestino(e.target.value)}
                        placeholder="Cidade de destino"
                        list="cidades-sugestoes-destino"
                      />
                      <datalist id="cidades-sugestoes-destino">
                        {sugestoesDestino.slice(0, 40).map((item) => {
                          const nome = cityName(item)
                          return <option key={`d-${nome}`} value={formatCityName(nome)} />
                        })}
                      </datalist>
                    </label>
                  </div>
                </fieldset>

                <button type="submit" className="cidades-cta" disabled={loading}>
                  {loading ? 'Pesquisando…' : 'Pesquisar'}
                </button>
              </form>
              <p className="cidades-map-note">
                Clique no mapa para preencher a UF de {mapaFoco === 'origem' ? 'saída' : 'destino'}.
              </p>
              {erro && (
                <p className="cidades-map-erro" role="alert">
                  {erro}
                </p>
              )}
            </Reveal>
            <MapaBrasil onSelectUf={handleMapaUf} selectedUf={selectedMapUf} />
          </div>
        </section>

        {(consulta || ufLista) && (
          <section className="cidades-wrap cidades-resultado" id="cidades-resultado">
            {consulta && (
              <div className={`cidades-status ${statusClass}`}>
                <strong>{statusTitulo}</strong>
                <p>
                  {formatCityName(consulta.origem.cidade)} / {consulta.origem.uf}
                  {' → '}
                  {formatCityName(consulta.destino.cidade)} / {consulta.destino.uf}
                </p>

                {consulta.tipo === 'direta' && (
                  <p className="cidades-map-note">Rota direta com a mesma transportadora.</p>
                )}

                {consulta.tipo === 'nao' && (
                  <p className="cidades-map-note">
                    {!consulta.origem.encontrada && !consulta.destino.encontrada
                      ? 'Saída e destino não encontrados na cobertura cadastrada.'
                      : !consulta.origem.encontrada
                        ? 'Cidade de saída não encontrada na cobertura.'
                        : !consulta.destino.encontrada
                          ? 'Cidade de destino não encontrada na cobertura.'
                          : 'Não foi possível montar rota direta nem redespacho com a cobertura cadastrada.'}
                  </p>
                )}

                {consulta.atendida ? (
                  <Link to="/cotacao" className="cidades-cta cidades-cta-inline">
                    Fazer cotação
                  </Link>
                ) : null}
              </div>
            )}

            {ufLista && (
              <div id="cidades-lista-uf">
                <div className="cidades-resultado-head">
                  <div>
                    <p className="cidades-map-label">
                      Cidades de {mapaFoco === 'origem' ? 'saída' : 'destino'}
                    </p>
                    <h2>
                      {carregandoLista
                        ? `Carregando cidades em ${ufLista}…`
                        : `${cidadesDaUf.length} cidade${cidadesDaUf.length === 1 ? '' : 's'} em ${ufLista}`}
                    </h2>
                  </div>
                </div>

                {carregandoLista ? (
                  <p className="cidades-map-note">Buscando cobertura cadastrada…</p>
                ) : cidadesFiltradas.length === 0 ? (
                  <p className="cidades-map-note">
                    {cidadesDaUf.length === 0
                      ? 'Nenhuma cidade cadastrada para esta UF.'
                      : 'Nenhuma cidade encontrada com esse filtro.'}
                  </p>
                ) : (
                  <ul className="cidades-lista">
                    {cidadesFiltradas.map((item) => {
                      const nome = cityName(item)
                      const siglas = citySiglas(item)
                      const selecionada =
                        String(cidadeListaFiltro || '').trim().toLocaleLowerCase('pt-BR') ===
                        nome.toLocaleLowerCase('pt-BR')
                      return (
                        <li key={`${ufLista}-${nome}-${siglas.join('-')}`} className={selecionada ? 'is-match' : ''}>
                          <button
                            type="button"
                            className="cidades-lista-btn"
                            onClick={() => escolherCidadeLista(nome)}
                          >
                            <span className="cidades-lista-nome">{formatCityName(nome)}</span>
                            <SiglasBadges siglas={siglas} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default CidadesAtendidas
