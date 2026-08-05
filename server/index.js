import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { cotar, getMercadorias } from './sswClient.js'
import { rastrearPorDanfe, rastrearPorDocumento } from './sswTracking.js'
import { solicitarColeta } from './sswColeta.js'
import { buscarCidadesPorNome, listarCidadesPorUf } from './sswCidades.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/mercadorias', async (req, res) => {
  try {
    const { cnpjPagador } = req.query
    if (!cnpjPagador) {
      return res.status(400).json({ erro: -1, mensagem: 'Informe o CNPJ do pagador', mercadorias: [] })
    }

    const result = await getMercadorias(cnpjPagador)
    if (result.erro && result.erro < 0) {
      return res.status(400).json(result)
    }
    return res.json(result)
  } catch (error) {
    console.error('Erro getMercadorias:', error)
    return res.status(500).json({
      erro: -2,
      mensagem: error.message || 'Erro interno ao buscar mercadorias',
      mercadorias: [],
    })
  }
})

app.get('/api/cidades', async (req, res) => {
  try {
    const uf = String(req.query.uf || '').trim()
    const cidade = String(req.query.cidade || '').trim()

    if (uf) {
      const result = await listarCidadesPorUf(uf)
      return res.json(result)
    }

    if (cidade) {
      const result = await buscarCidadesPorNome(cidade)
      return res.json(result)
    }

    return res.status(400).json({
      sucesso: false,
      mensagem: 'Informe a UF ou o nome da cidade.',
      cidades: [],
    })
  } catch (error) {
    console.error('Erro cidades:', error)
    return res.status(500).json({
      sucesso: false,
      mensagem: error.message || 'Erro interno ao consultar cidades atendidas',
      cidades: [],
    })
  }
})

app.post('/api/rastreio', async (req, res) => {
  try {
    const body = req.body || {}
    const modo = body.modo === 'documento' ? 'documento' : 'danfe'

    const result = modo === 'documento'
      ? await rastrearPorDocumento({
          documento: body.documento,
          nroNf: body.nroNf,
          senha: body.senha,
        })
      : await rastrearPorDanfe(body.chaveDanfe)

    return res.status(result.sucesso ? 200 : 404).json(result)
  } catch (error) {
    console.error('Erro rastreio:', error)
    return res.status(500).json({
      sucesso: false,
      mensagem: error.message || 'Erro interno ao rastrear encomenda',
      documentos: [],
    })
  }
})

app.post('/api/coleta', async (req, res) => {
  try {
    const body = req.body || {}
    const required = ['solicitante', 'tipoPagamento', 'cepEntrega', 'limiteColeta', 'quantidade', 'peso']
    const missing = required.filter((field) => !body[field] && body[field] !== 0)

    if (missing.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: `Campos obrigatórios ausentes: ${missing.join(', ')}`,
        numeroColeta: '',
      })
    }

    const result = await solicitarColeta(body)
    return res.status(result.sucesso ? 200 : 400).json(result)
  } catch (error) {
    console.error('Erro coleta:', error)
    return res.status(500).json({
      sucesso: false,
      mensagem: error.message || 'Erro interno ao solicitar coleta',
      numeroColeta: '',
    })
  }
})

app.post('/api/cotacao', async (req, res) => {
  try {
    const body = req.body || {}
    const required = ['cnpjPagador', 'cepOrigem', 'cepDestino', 'valorNF', 'quantidade']
    const missing = required.filter((field) => !body[field] && body[field] !== 0)

    if (missing.length > 0) {
      return res.status(400).json({
        erro: -1,
        mensagem: `Campos obrigatórios ausentes: ${missing.join(', ')}`,
        sucesso: false,
      })
    }

    const result = await cotar(body)

    if (result.erro < 0) {
      return res.status(400).json(result)
    }

    return res.json(result)
  } catch (error) {
    console.error('Erro cotar:', error)
    return res.status(500).json({
      erro: -2,
      mensagem: error.message || 'Erro interno ao cotar frete',
      sucesso: false,
    })
  }
})

app.listen(PORT, () => {
  console.log(`API Jetlu rodando em http://localhost:${PORT}`)
})
