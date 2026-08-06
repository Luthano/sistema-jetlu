function text(parent, tag) {
  if (!parent) return ''
  const node = parent.getElementsByTagName(tag)[0]
  return (node?.textContent || '').trim()
}

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length !== 8) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function readEndereco(parent, prefix) {
  const ender = parent?.getElementsByTagName(prefix)[0]
  if (!ender) {
    return { cep: '', endereco: '', numero: '', bairro: '', cidade: '', uf: '', complemento: '' }
  }
  return {
    cep: formatCep(text(ender, 'CEP')),
    endereco: text(ender, 'xLgr'),
    numero: text(ender, 'nro'),
    bairro: text(ender, 'xBairro'),
    cidade: text(ender, 'xMun'),
    uf: text(ender, 'UF'),
    complemento: text(ender, 'xCpl'),
  }
}

function readPessoa(parent, enderTag) {
  if (!parent) {
    return {
      nome: '',
      doc: '',
      ...readEndereco(null, enderTag),
    }
  }
  const doc = onlyDigits(text(parent, 'CNPJ') || text(parent, 'CPF'))
  return {
    nome: text(parent, 'xNome') || text(parent, 'xFant'),
    doc,
    ...readEndereco(parent, enderTag),
  }
}

export function criarEtiquetaVazia(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    origem: 'manual',
    arquivo: '',
    chaveNfe: '',
    nroNf: '',
    serie: '',
    volumeAtual: 1,
    volumeTotal: 1,
    rem: {
      nome: '',
      doc: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      complemento: '',
    },
    dest: {
      nome: '',
      doc: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      complemento: '',
    },
    ...overrides,
  }
}

export function parseNfeXml(xmlText, fileName = '') {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error(`XML inválido${fileName ? ` (${fileName})` : ''}.`)
  }

  const inf =
    doc.getElementsByTagName('infNFe')[0] ||
    doc.querySelector('NFe > infNFe') ||
    doc.querySelector('nfeProc NFe infNFe')

  if (!inf) {
    throw new Error(`Não encontramos os dados da NF-e${fileName ? ` em ${fileName}` : ''}.`)
  }

  const ide = inf.getElementsByTagName('ide')[0]
  const emit = inf.getElementsByTagName('emit')[0]
  const dest = inf.getElementsByTagName('dest')[0]
  const vol = inf.getElementsByTagName('vol')[0]

  const idAttr = inf.getAttribute('Id') || ''
  const chaveNfe = onlyDigits(idAttr.replace(/^NFe/i, '')) || onlyDigits(text(doc, 'chNFe'))
  const nroNf = text(ide, 'nNF')
  const serie = text(ide, 'serie')
  const qVol = Math.max(1, Number(text(vol, 'qVol')) || 1)

  const rem = readPessoa(emit, 'enderEmit')
  const destinatario = readPessoa(dest, 'enderDest')

  const etiquetas = []
  for (let i = 1; i <= qVol; i += 1) {
    etiquetas.push(
      criarEtiquetaVazia({
        origem: 'xml',
        arquivo: fileName,
        chaveNfe,
        nroNf,
        serie,
        volumeAtual: i,
        volumeTotal: qVol,
        rem,
        dest: destinatario,
      }),
    )
  }

  return etiquetas
}

export function formatDoc(value) {
  const digits = onlyDigits(value)
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value || ''
}

export function volumeLabel(etiqueta) {
  const atual = String(etiqueta.volumeAtual || 1).padStart(3, '0')
  const total = String(etiqueta.volumeTotal || 1).padStart(3, '0')
  return `${atual}/${total}`
}
