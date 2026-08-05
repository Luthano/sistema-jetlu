import { UFS_ATENDIDAS } from '../src/lib/ufsAtendidas.js'

const CACHE_TTL_MS = 15 * 60 * 1000
const cache = new Map()

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

function getDominio() {
  const dominio = String(process.env.SSW_DOMINIO || '').trim().toUpperCase()
  if (!dominio) {
    throw new Error('SSW_DOMINIO não configurado no .env')
  }
  return dominio
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
      mensagem: `A Jetlu não lista cobertura para ${uf} neste sistema.`,
    }
  }

  const cached = cache.get(uf)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data
  }

  const dominio = getDominio()
  const origens = getOrigens()
  if (origens.length === 0) {
    throw new Error('Configure SSW_CIDADES_ORIGEM no .env, ex.: CASCAVEL / PR')
  }

  const unicas = new Set()
  const mensagens = []

  for (const origem of origens) {
    const result = await consultarOrigem(dominio, origem, uf)
    result.cidades.forEach((cidade) => unicas.add(cidade))
    if (result.mensagem && result.cidades.length === 0) {
      mensagens.push(result.mensagem)
    }
  }

  const cidades = [...unicas].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const data = {
    sucesso: true,
    uf,
    total: cidades.length,
    cidades,
    mensagem: cidades.length
      ? `${cidades.length} cidade(s) atendida(s) pela Jetlu em ${uf}`
      : mensagens[0] || `Nenhuma cidade atendida em ${uf}`,
  }

  cache.set(uf, { at: Date.now(), data })
  return data
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

function filtrarCidades(query, cidades) {
  const termo = normalizeText(query)
  if (!termo || !Array.isArray(cidades)) return []

  return cidades.filter((cidade) => {
    const nome = normalizeText(cidade)
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
      for (const cidade of filtrarCidades(nome, data.cidades)) {
        matches.push({ uf: data.uf, cidade })
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
    cidades: matches.map((item) => `${item.cidade} / ${item.uf}`),
    matches,
    mensagem: matches.length
      ? `${matches.length} cidade(s) atendida(s) encontrada(s)`
      : `Nenhuma cidade atendida encontrada para "${nome}"`,
  }
}
