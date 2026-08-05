const TRACKING_DANFE_URL = 'https://ssw.inf.br/api/trackingdanfe'
const TRACKING_REMETENTE_URL = 'https://ssw.inf.br/api/tracking'
const TRACKING_DEST_URL = 'https://ssw.inf.br/api/trackingdest'
const TRACKING_PAG_URL = 'https://ssw.inf.br/api/trackingpag'
const TRACKING_PF_URL = 'https://ssw.inf.br/api/trackingpf'

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function getCredentials() {
  const { SSW_DOMINIO, SSW_LOGIN, SSW_SENHA } = process.env
  if (!SSW_DOMINIO || !SSW_LOGIN || !SSW_SENHA) {
    throw new Error('Credenciais SSW não configuradas. Preencha SSW_DOMINIO, SSW_LOGIN e SSW_SENHA no .env')
  }
  return {
    dominio: SSW_DOMINIO,
    usuario: SSW_LOGIN,
    senha: SSW_SENHA,
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

function collectDocuments(payload) {
  if (!payload) return []
  if (Array.isArray(payload.documentos)) return payload.documentos
  if (payload.documento) {
    return Array.isArray(payload.documento) ? payload.documento : [payload.documento]
  }
  return []
}

function normalizeResponse(payload) {
  const documentos = collectDocuments(payload).map((doc) => {
    const header = doc.header || doc
    const tracking = doc.tracking || doc.ocorrencias || []
    return {
      remetente: header.remetente || '',
      destinatario: header.destinatario || '',
      nroNf: String(header.nro_nf ?? header.nroNf ?? ''),
      pedido: header.pedido || '',
      eventos: (Array.isArray(tracking) ? tracking : []).map(normalizeEvent),
    }
  }).filter((doc) => doc.eventos.length > 0 || doc.nroNf || doc.remetente || doc.destinatario)

  const sucesso = Boolean(payload?.success) && documentos.length > 0
  return {
    sucesso,
    mensagem: payload?.message || (sucesso ? 'Documento localizado com sucesso' : 'Nenhum documento localizado'),
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
  const siglaEmp = process.env.SSW_DOMINIO || undefined
  const body = {
    cnpj,
    nro_nf: Number(nroNf),
    ...(siglaEmp ? { sigla_emp: siglaEmp } : {}),
    ...(senha ? { senha } : {}),
  }

  const endpoints = [TRACKING_DEST_URL, TRACKING_REMETENTE_URL, TRACKING_PAG_URL]
  let last = { success: false, message: 'Nenhum documento localizado' }

  for (const url of endpoints) {
    const payload = await postJson(url, body)
    const normalized = normalizeResponse(payload)
    if (normalized.sucesso) return normalized
    last = payload
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
    return normalizeResponse(payload)
  }

  if (doc.length === 14) {
    return rastrearCnpjNasApis({ cnpj: doc, nroNf: nf, senha: senha?.trim() })
  }

  return { sucesso: false, mensagem: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)', documentos: [] }
}
