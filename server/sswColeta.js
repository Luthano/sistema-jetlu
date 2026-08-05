import { XMLParser } from 'fast-xml-parser'

const NS = 'urn:sswinfbr.sswColeta'
const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: true,
})

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildSoapEnvelope(method, fields) {
  const body = Object.entries(fields)
    .map(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return `<${key} xsi:nil="true"/>`
      }
      return `<${key}>${escapeXml(value)}</${key}>`
    })
    .join('')

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${method} xmlns="${NS}">
      ${body}
    </${method}>
  </soap:Body>
</soap:Envelope>`
}

function getCredentials() {
  const { SSW_DOMINIO, SSW_LOGIN, SSW_SENHA } = process.env
  if (!SSW_DOMINIO || !SSW_LOGIN || !SSW_SENHA) {
    throw new Error('Credenciais SSW não configuradas. Preencha SSW_DOMINIO, SSW_LOGIN e SSW_SENHA no .env')
  }
  return {
    dominio: SSW_DOMINIO,
    login: SSW_LOGIN,
    senha: SSW_SENHA,
  }
}

function getEndpoint() {
  return process.env.SSW_COLETA_URL || 'https://ssw.inf.br/ws/sswColeta/index.php'
}

function extractReturnXml(soapResponse) {
  const decoded = soapResponse
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")

  const returnMatch = decoded.match(/<return[^>]*>([\s\S]*?)<\/return>/i)
  if (returnMatch) {
    let inner = returnMatch[1].trim()
    if (inner.includes('&lt;')) {
      inner = inner
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
    }
    return inner
  }

  const coletarMatch = decoded.match(/<coletar[\s\S]*<\/coletar>/i)
  if (coletarMatch) return coletarMatch[0]

  return decoded
}

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function toSoapDateTime(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function assertLimiteColeta(isoDateTime) {
  const date = new Date(isoDateTime)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Informe uma data e hora limite válidas para a coleta.')
  }

  const now = new Date()
  const max = new Date()
  max.setDate(max.getDate() + 15)

  if (date.getTime() < now.getTime() - 60 * 1000) {
    throw new Error('A data limite da coleta não pode estar no passado.')
  }
  if (date.getTime() > max.getTime()) {
    throw new Error('A data de coleta não pode ultrapassar 15 dias.')
  }
}

export async function solicitarColeta(payload) {
  const credentials = getCredentials()
  const solicitante = String(payload.solicitante ?? '').trim()
  const tipoPagamento = payload.tipoPagamento === 'D' ? 'D' : 'O'
  const quantidade = Number(payload.quantidade)
  const peso = Number(payload.peso)
  const cepEntrega = onlyDigits(payload.cepEntrega)
  const limiteColeta = toSoapDateTime(payload.limiteColeta)

  if (!solicitante) throw new Error('Informe o nome do solicitante.')
  if (!cepEntrega) throw new Error('Informe o CEP de entrega.')
  if (!quantidade || quantidade <= 0) throw new Error('Informe a quantidade de volumes.')
  if (!peso || peso <= 0) throw new Error('Informe o peso da carga.')
  assertLimiteColeta(limiteColeta)

  const fields = {
    ...credentials,
    cnpjRemetente: onlyDigits(payload.cnpjRemetente) || undefined,
    cnpjDestinatario: onlyDigits(payload.cnpjDestinatario) || undefined,
    numeroNF: String(payload.numeroNF ?? '').trim() || undefined,
    tipoPagamento,
    enderecoEntrega: String(payload.enderecoEntrega ?? '').trim() || undefined,
    cepEntrega,
    solicitante,
    limiteColeta,
    quantidade,
    peso,
    observacao: String(payload.observacao ?? '').trim().slice(0, 80) || undefined,
    instrucao: String(payload.instrucao ?? '').trim().slice(0, 80) || undefined,
    cubagem: payload.cubagem ? Number(payload.cubagem) : undefined,
    valorMerc: payload.valorMerc ? Number(payload.valorMerc) : undefined,
    cnpjSolicitante: onlyDigits(payload.cnpjSolicitante) || undefined,
    cepEndColeta: onlyDigits(payload.cepEndColeta) || undefined,
    logradouroEndColeta: String(payload.logradouroEndColeta ?? '').trim() || undefined,
    numeroEndColeta: String(payload.numeroEndColeta ?? '').trim() || undefined,
    complementoEndColeta: String(payload.complementoEndColeta ?? '').trim() || undefined,
    bairroEndColeta: String(payload.bairroEndColeta ?? '').trim() || undefined,
  }

  const envelope = buildSoapEnvelope('coletar', fields)
  const response = await fetch(getEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `${NS}#coletar`,
      Accept: 'text/xml',
    },
    body: envelope,
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`SSW respondeu HTTP ${response.status}: ${text.slice(0, 200)}`)
  }

  const xml = extractReturnXml(text)
  const parsed = parser.parse(xml)
  const coletar = parsed.coletar || parsed
  const erro = Number(coletar.erro)
  const numeroColeta = String(coletar.numeroColeta || '').trim()

  return {
    erro,
    sucesso: erro === 0 && Boolean(numeroColeta),
    mensagem: coletar.mensagem || (erro === 0 ? 'Coleta gerada com sucesso' : 'Não foi possível gerar a coleta'),
    numeroColeta,
  }
}
