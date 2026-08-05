export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

export function formatCityName(name) {
  return String(name)
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s(/-])(\p{L})/gu, (_, sep, letter) => sep + letter.toLocaleUpperCase('pt-BR'))
}

export function matchCity(query, cidades) {
  const termo = normalizeText(query)
  if (!termo || !Array.isArray(cidades)) return null

  const exact = cidades.find((cidade) => normalizeText(cidade) === termo)
  if (exact) return exact

  const starts = cidades.filter((cidade) => normalizeText(cidade).startsWith(termo))
  if (starts.length === 1) return starts[0]

  if (termo.length >= 3) {
    const contains = cidades.filter((cidade) => {
      const nome = normalizeText(cidade)
      return nome.includes(termo) && termo.length / nome.length >= 0.45
    })
    if (contains.length === 1) return contains[0]
  }

  return null
}

export async function buscarCidadesPorUf(uf) {
  const res = await fetch(`/api/cidades?uf=${encodeURIComponent(uf)}`)
  const data = await res.json()
  if (!data.sucesso) {
    throw new Error(data.mensagem || 'Não foi possível consultar as cidades no SSW.')
  }
  return data
}

export async function buscarCidadesPorNome(cidade) {
  const res = await fetch(`/api/cidades?cidade=${encodeURIComponent(cidade)}`)
  const data = await res.json()
  if (!data.sucesso) {
    throw new Error(data.mensagem || 'Não foi possível consultar as cidades no SSW.')
  }
  return data
}

export async function buscarEnderecoPorCep(cep) {
  const digits = onlyDigits(cep)
  if (digits.length !== 8) {
    throw new Error('Informe um CEP com 8 dígitos.')
  }

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
  const data = await res.json()
  if (data?.erro) {
    throw new Error('CEP não encontrado.')
  }

  return {
    uf: String(data.uf || '').toUpperCase(),
    cidade: String(data.localidade || '').trim(),
    bairro: String(data.bairro || '').trim(),
  }
}
