/**
 * Ajustes manuais da cobertura exibida (após consulta SSW).
 *
 * - UFS_MARCA_JETLU: malha SSW no domínio Lopesul (LSU), badge comercial JL.
 * - CIDADE_OVERRIDES: força siglas ou remove/inclui cidade por UF.
 */

function normalizeKey(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

/** UFs comercializadas como Jetlu mesmo quando a malha SSW vem da Lopesul. */
export const UFS_MARCA_JETLU = new Set(['PA', 'PE', 'MT', 'RS'])

/**
 * Ajustes pontuais por UF (nome da cidade → siglas[] | null para remover).
 * Ex.: BA: { 'Santa Maria Da Vitoria': ['JL'] }
 */
export const CIDADE_OVERRIDES = {
  // Preenchido conforme a revisão manual UF a UF.
}

export function siglaComercial(sigla, uf) {
  if (UFS_MARCA_JETLU.has(uf) && sigla === 'LS') return 'JL'
  return sigla
}

export function aplicarOverridesCidades(uf, cidades) {
  const mapa = CIDADE_OVERRIDES[uf]
  if (!mapa || typeof mapa !== 'object') return cidades

  const forced = new Map()
  for (const [nome, siglas] of Object.entries(mapa)) {
    forced.set(normalizeKey(nome), { nome, siglas })
  }

  const out = []
  const seen = new Set()

  for (const item of cidades) {
    const key = normalizeKey(item.nome)
    if (!forced.has(key)) {
      out.push(item)
      seen.add(key)
      continue
    }
    const rule = forced.get(key)
    if (rule.siglas == null) {
      seen.add(key)
      continue
    }
    out.push({ nome: item.nome, siglas: [...rule.siglas] })
    seen.add(key)
  }

  for (const [key, rule] of forced.entries()) {
    if (seen.has(key) || rule.siglas == null) continue
    out.push({ nome: rule.nome, siglas: [...rule.siglas] })
  }

  return out.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
