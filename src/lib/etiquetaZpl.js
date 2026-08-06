import { formatDoc, volumeLabel } from './nfeXml'

function sanitize(value) {
  return String(value ?? '')
    .replace(/[\^~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(value, max) {
  const text = sanitize(value)
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

/** Gera ZPL aproximado para etiqueta 100x50 mm (203 dpi). */
export function gerarZplEtiqueta(etiqueta) {
  const remNome = truncate(etiqueta.rem?.nome, 28)
  const remDoc = formatDoc(etiqueta.rem?.doc) || onlyDigitsSafe(etiqueta.rem?.doc)
  const destNome = truncate(etiqueta.dest?.nome || 'DESTINATÁRIO', 26)
  const cidadeUf = truncate(
    [etiqueta.dest?.cidade, etiqueta.dest?.uf].filter(Boolean).join('-') || 'Cidade-UF',
    24,
  )
  const cep = sanitize(etiqueta.dest?.cep) || '00000-000'
  const nf = sanitize(etiqueta.nroNf) || '000000'
  const vol = volumeLabel(etiqueta)
  const barcode = sanitize(etiqueta.chaveNfe) || sanitize(etiqueta.nroNf) || '000000'

  return `^XA
^PW800
^LL400
^CF0,22
^FO24,20^FDREM: ${remNome}^FS
^FO520,20^FDCNPJ: ${truncate(remDoc, 18)}^FS
^FO24,70^A0N,34,34^FD${destNome}^FS
^FO24,118^A0N,22,22^FD${cidadeUf} · CEP ${cep}^FS
^FO24,170^A0N,40,40^FDNF: ${nf}^FS
^FO600,70^GB170,90,2^FS
^FO620,88^A0N,20,20^FDVOL^FS
^FO620,118^A0N,28,28^FD${vol}^FS
^FO24,240^BY2^BCN,72,Y,N,N^FD${barcode.slice(0, 22)}^FS
^FO620,240^BQN,2,4^FDQA,${truncate(barcode, 40)}^FS
^XZ`
}

function onlyDigitsSafe(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function gerarZplLote(etiquetas) {
  return etiquetas.map(gerarZplEtiqueta).join('\n')
}

export function baixarTexto(conteudo, nomeArquivo, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([conteudo], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
