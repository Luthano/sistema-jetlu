import { createClient } from '@supabase/supabase-js'

function getConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return { url, anonKey }
}

function getAccessToken(req) {
  const header = String(req.headers.authorization || '')
  if (!header.startsWith('Bearer ')) return ''
  return header.slice(7).trim()
}

export async function getAuthedSupabase(req) {
  const config = getConfig()
  const token = getAccessToken(req)
  if (!config || !token) return null

  const client = createClient(config.url, config.anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return null

  return { client, userId: data.user.id }
}

export async function salvarCotacaoHistorico(req, body, result) {
  try {
    const auth = await getAuthedSupabase(req)
    if (!auth) return

    const { error } = await auth.client.from('cotacoes').insert({
      user_id: auth.userId,
      cnpj_pagador: body.cnpjPagador || null,
      cnpj_remetente: body.cnpjRemetente || null,
      cnpj_destinatario: body.cnpjDestinatario || null,
      cep_origem: body.cepOrigem || null,
      cep_destino: body.cepDestino || null,
      valor_nf: body.valorNF ?? null,
      quantidade: body.quantidade ?? null,
      peso: body.peso ?? null,
      volume: body.volume ?? null,
      total_frete: result.totalFrete ?? null,
      prazo: result.prazo != null ? String(result.prazo) : null,
      payload: { request: body, response: { ...result, token: undefined } },
    })

    if (error) console.error('Erro ao gravar cotação no Supabase:', error.message)
  } catch (error) {
    console.error('Erro ao gravar cotação no Supabase:', error.message)
  }
}

export async function salvarColetaHistorico(req, body, result) {
  try {
    const auth = await getAuthedSupabase(req)
    if (!auth) return

    const { error } = await auth.client.from('coletas').insert({
      user_id: auth.userId,
      numero_coleta: result.numeroColeta || null,
      solicitante: body.solicitante || null,
      cep_coleta: body.cepEndColeta || null,
      cep_entrega: body.cepEntrega || null,
      quantidade: body.quantidade ?? null,
      peso: body.peso ?? null,
      limite_coleta: body.limiteColeta || null,
      payload: { request: body, response: result },
    })

    if (error) console.error('Erro ao gravar coleta no Supabase:', error.message)
  } catch (error) {
    console.error('Erro ao gravar coleta no Supabase:', error.message)
  }
}
