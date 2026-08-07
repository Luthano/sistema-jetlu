import { UFS_ATENDIDAS } from '../src/lib/ufsAtendidas.js'
import { getDefaultCredentials, listActiveCarriers } from './sswCarriers.js'
import {
  aplicarOverridesCidades,
  siglaComercial,
} from './cidadesOverrides.js'

const CACHE_TTL_MS = 15 * 60 * 1000
const CACHE_VERSION = 'v2-overrides'
const cache = new Map()

/** Siglas exibidas na UI: Lopesul = LS, Jetlu = JL */
const SIGLA_POR_CARRIER = {
  lopesul: 'LS',
  jetlu: 'JL',
}

const ORDEM_SIGLAS = ['JL', 'LS']

export { UFS_ATENDIDAS }

const UF_PESQUISA = {
  AL: '(AL)ALAGOAS',
  BA: '(BA)BAHIA',
  CE: '(CE)CEARA',
  DF: '(DF)DISTRITO FEDERAL',
  ES: '(ES)ESPIRITO SANTO',
  GO: '(GO)GOIAS',
  MA: '(MA)MARANHAO',
  MG: '(MI)MINAS GERAIS',
  MS: '(MS)MATO GROSSO DO SUL',
  MT: '(MT)MATO GROSSO',
  PA: '(PA)PARA',
  PB: '(PB)PARAIBA',
  PE: '(PE)PERNAMBUCO',
  PI: '(PI)PIAUI',
  PR: '(PR)PARANA',
  RJ: '(RJ)RIO DE JANEIRO',
  RN: '(RN)RIO GRANDE DO NORTE',
  RS: '(RS)RIO GRANDE DO SUL',
  SC: '(SC)SANTA CATARINA',
  SE: '(SE)SERGIPE',
  SP: '(SP)SAO PAULO',
  TO: '(TO)TOCANTINS',
}

function getOrigens() {
  const raw = process.env.SSW_CIDADES_ORIGEM || 'CASCAVEL / PR,MARINGA / PR,LONDRINA / PR'
  return raw
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
}

function getEndpoint() {
  return process.env.SSW_AREAS_URL || 'https://ssw.inf.br/2/areas'
}

function normalizeUf(value) {
  return String(value ?? '').trim().toUpperCase()
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim()
}

function extractErro(html) {
  const match = html.match(/<label class=["']?erro["']?>([\s\S]*?)<\/label>/i)
  if (!match) return ''
  return decodeHtml(match[1]).replace(/\s+/g, ' ')
}

function parseCidades(html) {
  const cidades = []
  const regex = /<cidade>([^<]+)<\/cidade>/gi
  let match = regex.exec(html)

  while (match) {
    const raw = decodeURIComponent(String(match[1]).replace(/\+/g, ' '))
    const nome = raw.includes('/') ? raw.split('/').slice(1).join('/').trim() : raw.trim()
    if (nome) cidades.push(nome.replace(/\s+/g, ' '))
    match = regex.exec(html)
  }

  return [...new Set(cidades)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function ordenarSiglas(siglas) {
  return [...siglas].sort((a, b) => {
    const ia = ORDEM_SIGLAS.indexOf(a)
    const ib = ORDEM_SIGLAS.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

function siglaDoCarrier(carrier) {
  if (SIGLA_POR_CARRIER[carrier.id]) return SIGLA_POR_CARRIER[carrier.id]
  const dominio = String(carrier.dominio || '').toUpperCase()
  if (dominio === 'JEU') return 'JL'
  if (dominio === 'LSU') return 'LS'
  return null
}

/** Jetlu + Lopesul com credenciais; fallback no domínio padrão. */
function carriersParaCidades() {
  const ativos = listActiveCarriers()
    .map((carrier) => {
      const sigla = siglaDoCarrier(carrier)
      if (!sigla) return null
      return { ...carrier, sigla }
    })
    .filter(Boolean)

  if (ativos.length > 0) return ativos

  const legacy = getDefaultCredentials()
  const dominio = String(legacy?.dominio || '').trim()
  if (!dominio) return []

  const sigla = dominio.toUpperCase() === 'JEU' ? 'JL' : dominio.toUpperCase() === 'LSU' ? 'LS' : null
  if (!sigla) return []

  return [
    {
      id: sigla === 'JL' ? 'jetlu' : 'lopesul',
      nome: sigla === 'JL' ? 'Jetlu' : 'Lopesul',
      dominio,
      sigla,
    },
  ]
}

async function consultarOrigem(dominio, origem, uf) {
  const body = new URLSearchParams({
    sigla_emp: dominio,
    find: 'U',
    type: 'uf',
    sc: 'N',
    co: origem,
    cidadeori: origem,
    uf,
    ufe: UF_PESQUISA[uf] || `(${uf})${uf}`,
  })

  const response = await fetch(getEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html',
    },
    body,
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  const html = buffer.toString('latin1')

  if (!response.ok) {
    throw new Error(`SSW respondeu HTTP ${response.status} na consulta de áreas`)
  }

  return {
    cidades: parseCidades(html),
    mensagem: extractErro(html),
  }
}

async function listarCidadesCarrier(carrier, uf, origens) {
  const unicas = new Set()
  const mensagens = []

  for (const origem of origens) {
    try {
      const result = await consultarOrigem(carrier.dominio, origem, uf)
      result.cidades.forEach((cidade) => unicas.add(cidade))
      if (result.mensagem && result.cidades.length === 0) {
        mensagens.push(result.mensagem)
      }
    } catch (error) {
      mensagens.push(error.message || `Falha ao consultar ${carrier.sigla}`)
      console.error(`[cidades] ${carrier.sigla} origem ${origem} UF ${uf}:`, error.message)
    }
  }

  return {
    sigla: carrier.sigla,
    nome: carrier.nome,
    cidades: [...unicas],
    mensagens,
  }
}

function mesclarPorCidade(resultados, uf) {
  const byKey = new Map()

  for (const resultado of resultados) {
    const sigla = siglaComercial(resultado.sigla, uf)

    for (const nome of resultado.cidades) {
      const key = normalizeText(nome)
      let entry = byKey.get(key)
      if (!entry) {
        entry = { nome, siglas: new Set() }
        byKey.set(key, entry)
      }
      entry.siglas.add(sigla)
    }
  }

  return [...byKey.values()]
    .map((entry) => ({
      nome: entry.nome,
      siglas: ordenarSiglas(entry.siglas),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

function cacheKey(uf) {
  return `${CACHE_VERSION}:${uf}`
}

export async function listarCidadesPorUf(ufRaw) {
  const uf = normalizeUf(ufRaw)
  if (!/^[A-Z]{2}$/.test(uf)) {
    throw new Error('Informe uma UF válida.')
  }
  if (!UFS_ATENDIDAS.includes(uf)) {
    return {
      sucesso: true,
      uf,
      total: 0,
      cidades: [],
      mensagem: `Não há cobertura listada para ${uf} neste sistema.`,
    }
  }

  const key = cacheKey(uf)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data
  }

  const carriers = carriersParaCidades()
  const origens = getOrigens()
  if (carriers.length === 0) {
    throw new Error('Nenhuma transportadora (Jetlu/Lopesul) configurada para consultar cidades.')
  }
  if (origens.length === 0) {
    throw new Error('Configure SSW_CIDADES_ORIGEM no .env, ex.: CASCAVEL / PR')
  }

  const resultados = await Promise.all(carriers.map((carrier) => listarCidadesCarrier(carrier, uf, origens)))
  const mescladas = mesclarPorCidade(resultados, uf)
  const cidades = aplicarOverridesCidades(uf, mescladas)
  const siglasPresentes = ordenarSiglas(new Set(cidades.flatMap((c) => c.siglas)))
  const labels = siglasPresentes.join(' + ') || carriers.map((c) => c.sigla).join(' + ')
  const falhas = resultados.filter((r) => r.cidades.length === 0 && r.mensagens.length > 0)

  const data = {
    sucesso: true,
    uf,
    total: cidades.length,
    cidades,
    carriers: carriers.map((c) => ({ id: c.id, nome: c.nome, sigla: c.sigla })),
    mensagem: cidades.length
      ? `${cidades.length} cidade(s) em ${uf} (${labels})`
      : falhas[0]?.mensagens[0] || `Nenhuma cidade atendida em ${uf}`,
  }

  cache.set(key, { at: Date.now(), data })
  return data
}

function filtrarCidades(query, cidades) {
  const termo = normalizeText(query)
  if (!termo || !Array.isArray(cidades)) return []

  return cidades.filter((item) => {
    const nome = normalizeText(item?.nome ?? item)
    return nome === termo || nome.startsWith(termo) || (termo.length >= 3 && nome.includes(termo))
  })
}

export async function buscarCidadesPorNome(nomeRaw) {
  const nome = String(nomeRaw ?? '').trim()
  if (nome.length < 2) {
    throw new Error('Informe ao menos 2 caracteres da cidade.')
  }

  const matches = []

  for (const uf of UFS_ATENDIDAS) {
    try {
      const data = await listarCidadesPorUf(uf)
      for (const item of filtrarCidades(nome, data.cidades)) {
        matches.push({
          uf: data.uf,
          cidade: item.nome,
          nome: item.nome,
          siglas: item.siglas,
        })
      }
    } catch (error) {
      console.error(`Erro ao consultar cidades de ${uf}:`, error.message)
    }
  }

  matches.sort((a, b) => {
    const byCity = a.cidade.localeCompare(b.cidade, 'pt-BR')
    return byCity || a.uf.localeCompare(b.uf, 'pt-BR')
  })

  return {
    sucesso: true,
    uf: '',
    total: matches.length,
    cidades: matches.map((item) => ({
      nome: `${item.cidade} / ${item.uf}`,
      siglas: item.siglas,
    })),
    matches,
    mensagem: matches.length
      ? `${matches.length} cidade(s) atendida(s) encontrada(s)`
      : `Nenhuma cidade atendida encontrada para "${nome}"`,
  }
}
