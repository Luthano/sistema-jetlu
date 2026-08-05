import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MapaBrasil from '../components/MapaBrasil'
import Reveal from '../components/Reveal'
import {
  buscarCidadesPorNome,
  buscarCidadesPorUf,
  buscarEnderecoPorCep,
  formatCep,
  formatCityName,
  matchCity,
  onlyDigits,
} from './cidadesBusca'
import { UFS_ATENDIDAS } from '../lib/ufsAtendidas'
import './CidadesAtendidas.css'

function CidadesAtendidas() {
  const [cep, setCep] = useState('')
  const [uf, setUf] = useState('')
  const [cidade, setCidade] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)
  const [consulta, setConsulta] = useState(null)
  const [cacheUf, setCacheUf] = useState({})

  const sugestoes = cacheUf[uf]?.cidades || resultado?.cidades || []
  const cidadesFiltradas = useMemo(() => {
    const lista = resultado?.cidades || []
    const termo = cidade.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return lista
    return lista.filter((item) => item.toLocaleLowerCase('pt-BR').includes(termo))
  }, [resultado, cidade])

  async function carregarUf(proximaUf) {
    if (!proximaUf) return null
    if (cacheUf[proximaUf]) return cacheUf[proximaUf]

    const data = await buscarCidadesPorUf(proximaUf)
    setCacheUf((prev) => ({ ...prev, [proximaUf]: data }))
    return data
  }

  async function preencherPorCep(valor) {
    const digits = onlyDigits(valor)
    if (digits.length !== 8) return

    setErro('')
    setLoading(true)
    try {
      const endereco = await buscarEnderecoPorCep(digits)
      setUf(endereco.uf)
      setCidade(endereco.cidade)
      await carregarUf(endereco.uf)
    } catch (error) {
      setErro(error.message || 'Não foi possível localizar o CEP.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePesquisar(event) {
    event.preventDefault()

    const temCep = onlyDigits(cep).length === 8
    const ufInformada = uf
    const cidadeInformada = cidade.trim()

    if (!temCep && !ufInformada && !cidadeInformada) {
      setErro('Informe o CEP, a UF ou a cidade.')
      return
    }

    setErro('')
    setLoading(true)

    try {
      let ufAtual = ufInformada
      let cidadeAtual = cidadeInformada

      if (temCep) {
        const endereco = await buscarEnderecoPorCep(cep)
        ufAtual = endereco.uf
        cidadeAtual = endereco.cidade
        setUf(ufAtual)
        setCidade(cidadeAtual)
      }

      if (ufAtual) {
        const data = await carregarUf(ufAtual)
        setResultado(data)

        if (cidadeAtual) {
          const encontrada = matchCity(cidadeAtual, data.cidades)
          setConsulta({
            uf: ufAtual,
            cidade: encontrada || cidadeAtual,
            atendida: Boolean(encontrada),
          })
        } else {
          setConsulta(null)
        }
      } else {
        const data = await buscarCidadesPorNome(cidadeAtual)
        const ufs = [...new Set((data.matches || []).map((item) => item.uf))]
        setResultado(data)
        setConsulta({
          uf: ufs.join(', '),
          cidade: cidadeAtual,
          atendida: data.total > 0,
        })
      }

      requestAnimationFrame(() => {
        document.getElementById('cidades-resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (error) {
      setResultado(null)
      setConsulta(null)
      setErro(error.message || 'Erro de comunicação com a API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="page-block cidades-page">
      <section className="cidades-map">
        <div className="cidades-wrap cidades-map-grid">
          <Reveal className="cidades-map-copy">
            <h1>A logística acelerada que faz acontecer.</h1>
            <p className="cidades-map-label">Consulte as cidades atendidas:</p>
            <form className="cidades-map-search" onSubmit={handlePesquisar}>
              <label>
                <span>CEP</span>
                <input
                  value={cep}
                  onChange={(e) => setCep(formatCep(e.target.value))}
                  onBlur={(e) => preencherPorCep(e.target.value)}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
              </label>
              <label>
                <span>UF</span>
                <select
                  value={uf}
                  onChange={(e) => {
                    setUf(e.target.value)
                    setConsulta(null)
                    if (e.target.value) carregarUf(e.target.value).catch(() => {})
                  }}
                >
                  <option value="">UF</option>
                  {UFS_ATENDIDAS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cidades-field-wide">
                <span>Cidade</span>
                <input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Nome da cidade"
                  list="cidades-sugestoes"
                />
                <datalist id="cidades-sugestoes">
                  {sugestoes.slice(0, 40).map((item) => (
                    <option key={item} value={formatCityName(item)} />
                  ))}
                </datalist>
              </label>
              <button type="submit" className="cidades-cta" disabled={loading}>
                {loading ? 'Pesquisando…' : 'Pesquisar'}
              </button>
            </form>
            {erro && (
              <p className="cidades-map-erro" role="alert">
                {erro}
              </p>
            )}
          </Reveal>
          <MapaBrasil />
        </div>
      </section>

      {(consulta || resultado) && (
        <section className="cidades-wrap cidades-resultado" id="cidades-resultado">
          {consulta && (
            <div className={`cidades-status ${consulta.atendida ? 'is-ok' : 'is-no'}`}>
              <strong>{consulta.atendida ? 'Cidade atendida' : 'Cidade não atendida'}</strong>
              <p>
                {formatCityName(consulta.cidade)}
                {consulta.uf ? ` / ${consulta.uf}` : ''}
              </p>
              {consulta.atendida ? (
                <Link to="/cotacao" className="cidades-cta cidades-cta-inline">
                  Fazer cotação
                </Link>
              ) : (
                <p className="cidades-map-note">Confira o nome da cidade ou fale com o atendimento Jetlu.</p>
              )}
            </div>
          )}

          {resultado && (
            <>
              <div className="cidades-resultado-head">
                <div>
                  <p className="cidades-map-label">{resultado.uf ? 'Cidades da UF' : 'Resultado da consulta'}</p>
                  <h2>
                    {resultado.uf
                      ? `${resultado.total} cidade${resultado.total === 1 ? '' : 's'} em ${resultado.uf}`
                      : `${resultado.total} cidade${resultado.total === 1 ? '' : 's'} encontrada${resultado.total === 1 ? '' : 's'}`}
                  </h2>
                </div>
              </div>

              {cidadesFiltradas.length === 0 ? (
                <p className="cidades-map-note">Nenhuma cidade encontrada com esse filtro.</p>
              ) : (
                <ul className="cidades-lista">
                  {cidadesFiltradas.map((item) => (
                    <li
                      key={item}
                      className={
                        consulta?.atendida && matchCity(consulta.cidade, [item]) ? 'is-match' : ''
                      }
                    >
                      {formatCityName(item)}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}
      </div>
    </div>
  )
}

export default CidadesAtendidas
