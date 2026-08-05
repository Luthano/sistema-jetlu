export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function formatCpf(value) {
  const digits = onlyDigits(value)
  if (digits.length !== 11) return digits || ''
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCnpj(value) {
  const digits = onlyDigits(value)
  if (digits.length !== 14) return digits || ''
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function formatPhone(value) {
  const digits = onlyDigits(value)
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return digits || ''
}

export function profileInitials(profile) {
  const source = String(profile?.nome_completo || profile?.email || '?').trim()
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function isProfileComplete(profile) {
  if (!profile) return false

  const nome = String(profile.nome_completo || '').trim()
  const endereco = String(profile.endereco || '').trim()
  const cpf = onlyDigits(profile.cpf)
  const cnpj = onlyDigits(profile.cnpj)
  const telefone = onlyDigits(profile.telefone)
  const whatsapp = onlyDigits(profile.whatsapp)

  return (
    nome.length >= 3 &&
    endereco.length >= 8 &&
    cpf.length === 11 &&
    cnpj.length === 14 &&
    telefone.length >= 10 &&
    whatsapp.length >= 10
  )
}
