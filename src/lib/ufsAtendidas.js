/** Todas as UFs do mapa (seleção no admin). */
export const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

/**
 * Fallback se a API de cobertura ainda não retornar UFs.
 * Preferir sempre GET /api/cidades?meta=ufs
 */
export const UFS_ATENDIDAS = [...UFS_BRASIL]

export const UF_MAPA_HREF = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  distritofederal: 'DF',
  espiritosanto: 'ES',
  goias: 'GO',
  maranhao: 'MA',
  matogrosso: 'MT',
  matogrossodosul: 'MS',
  minasgerais: 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  riodejaneiro: 'RJ',
  riograndedonorte: 'RN',
  riograndedosul: 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  santacatarina: 'SC',
  saopaulo: 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
}
