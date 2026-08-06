import { getDefaultCredentials } from './sswCarriers.js'

const TRACKING_DANFE_URL = 'https://ssw.inf.br/api/trackingdanfe'
const TRACKING_REMETENTE_URL = 'https://ssw.inf.br/api/tracking'
const TRACKING_DEST_URL = 'https://ssw.inf.br/api/trackingdest'
const TRACKING_PAG_URL = 'https://ssw.inf.br/api/trackingpag'
const TRACKING_PF_URL = 'https://ssw.inf.br/api/trackingpf'

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function getCredentials() {
  const cred = getDefaultCredentials()
  return {
    dominio: cred.dominio,
    usuario: cred.login,
    senha: cred.senha,
  }
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    throw new Error('Resposta inválida do rastreamento SSW')
  }

  if (!response.ok && !payload) {
    throw new Error(`Falha no rastreamento SSW (${response.status})`)
  }

  return payload || { success: false, message: 'Nenhum documento localizado' }
}

function normalizeEvent(event = {}) {
  return {
    dataHora: event.data_hora || event.dataHora || event.data_hora_efetiva || '',
    cidade: event.cidade || '',
    filial: event.filial || '',
    dominio: event.dominio || '',
    ocorrencia: event.ocorrencia || event.titulo || '',
    descricao: event.descricao || '',
    tipo: event.tipo || '',
    recebedor: event.nome_recebedor || event.recebedor || '',
    documentoRecebedor: event.nro_doc_recebedor || '',
  }
}

function asDocumentList(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function collectDocuments(payload) {
  if (!payload || typeof payload !== 'object') return []

  // Formatos oficiais observados nas WebAPIs SSW:
  // 1) { documentos: [ { header, tracking }, ... ] }
  // 2) { documento: { header, tracking } }  ou array
  // 3) { header, tracking } na raiz (tracking / trackingdest / trackingpag)
  if (payload.documentos != null) return asDocumentList(payload.documentos)
  if (payload.documento != null) return asDocumentList(payload.documento)

  const hasRootTracking = payload.tracking != null || payload.ocorrencias != null || payload.header != null
  if (hasRootTracking) return [payload]

  return []
}

function collectEvents(doc) {
  const tracking = doc?.tracking ?? doc?.ocorrencias ?? doc?.header?.tracking ?? []
  if (Array.isArray(tracking)) return tracking
  if (tracking && typeof tracking === 'object') return [tracking]
  return []
}

function normalizeResponse(payload) {
  const documentos = collectDocuments(payload).map((doc) => {
    const header = doc.header || doc
    return {
      remetente: header.remetente || '',
      destinatario: header.destinatario || '',
      nroNf: String(header.nro_nf ?? header.nroNf ?? ''),
      pedido: header.pedido || '',
      eventos: collectEvents(doc).map(normalizeEvent),
    }
  }).filter((doc) => doc.eventos.length > 0 || doc.nroNf || doc.remetente || doc.destinatario)

  const sucesso = Boolean(payload?.success ?? payload?.sucesso) && documentos.length > 0
  return {
    sucesso,
    mensagem:
      payload?.message ||
      payload?.mensagem ||
      (sucesso ? 'Documento localizado com sucesso' : 'Nenhum documento localizado'),
    documentos,
  }
}

export async function rastrearPorDanfe(chaveNfe) {
  const chave = onlyDigits(chaveNfe)
  if (chave.length !== 44) {
    return { sucesso: false, mensagem: 'Informe a chave DANFE com 44 dígitos', documentos: [] }
  }

  const payload = await postJson(TRACKING_DANFE_URL, { chave_nfe: chave })
  return normalizeResponse(payload)
}

async function rastrearCnpjNasApis({ cnpj, nroNf, senha }) {
  const siglaEmp = getDefaultCredentials().dominio || undefined
  const endpoints = [TRACKING_DEST_URL, TRACKING_REMETENTE_URL, TRACKING_PAG_URL]
  const bodyVariants = [
    {
      cnpj,
      nro_nf: Number(nroNf),
      ...(siglaEmp ? { sigla_emp: siglaEmp } : {}),
      ...(senha ? { senha } : {}),
    },
    // Fallback sem filtro de empresa, caso a carga esteja em parceiro/rede SSW
    {
      cnpj,
      nro_nf: Number(nroNf),
      ...(senha ? { senha } : {}),
    },
  ]

  let last = { success: false, message: 'Nenhum documento localizado' }

  for (const body of bodyVariants) {
    for (const url of endpoints) {
      const payload = await postJson(url, body)
      const normalized = normalizeResponse(payload)
      if (normalized.sucesso) return normalized
      last = payload
    }
  }

  return normalizeResponse(last)
}

export async function rastrearPorDocumento({ documento, nroNf, senha }) {
  const doc = onlyDigits(documento)
  const nf = onlyDigits(nroNf)

  if (!nf) {
    return { sucesso: false, mensagem: 'Informe o número da nota fiscal', documentos: [] }
  }

  if (doc.length === 11) {
    const credenciais = getCredentials()
    const payload = await postJson(TRACKING_PF_URL, {
      dominio: credenciais.dominio,
      usuario: credenciais.usuario,
      senha: credenciais.senha,
      cpf: doc,
      nro_nf: Number(nf),
    })
    const normalized = normalizeResponse(payload)
    if (!normalized.sucesso && /acesso\s*inv[aá]lido/i.test(normalized.mensagem || '')) {
      return {
        ...normalized,
        mensagem:
          'Credenciais SSW sem permissão para rastreio de CPF (trackingpf). Use a chave DANFE ou peça liberação do usuário no SSW.',
      }
    }
    return normalized
  }

  if (doc.length === 14) {
    return rastrearCnpjNasApis({ cnpj: doc, nroNf: nf, senha: senha?.trim() })
  }

  return { sucesso: false, mensagem: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)', documentos: [] }
}
