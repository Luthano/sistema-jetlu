const DETALHE_LABELS = {
  fretePeso: 'Frete peso',
  freteValor: 'Frete valor (Ad Valorem)',
  despacho: 'Despacho',
  cat: 'CAT',
  itr: 'ITR',
  gris: 'GRIS',
  pedagio: 'Pedágio',
  tas: 'TAS',
  adiclocal: 'Adicional local',
  suframa: 'SUFRAMA',
  devcannf: 'Devolução canhoto NF',
  reembolso: 'Reembolso',
  outros: 'Outros',
  coleta: 'Coleta',
  entrega: 'Entrega',
  adicFrete: 'Adicional de frete',
  trt: 'TRT',
  impostos: 'Impostos',
  tar: 'TAR',
  pos: 'POS',
  tdc: 'TDC',
  entGeral: 'TDE (entrega difícil)',
  agenda: 'Agendamento',
  paletiz: 'Paletização',
  separa: 'Separação',
  capataz: 'Capatazia',
  veicDedic: 'Veículo dedicado',
  CO2: 'Compensação CO2',
  RDC: 'RDC',
  seguroFluvial: 'Seguro fluvial',
  redespFluvial: 'Redespacho fluvial',
}

function formatMoney(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function OfertaCard({
  oferta,
  selecionada,
  onSelecionar,
  coletaAberta,
  numeroColeta,
  onSolicitarColeta,
  children,
}) {
  const detalhes = oferta?.detalhamento
    ? Object.entries(oferta.detalhamento).filter(([, value]) => Number(value) > 0)
    : []

  if (!oferta.sucesso) {
    return (
      <article className="oferta-card oferta-card--erro">
        <header className="oferta-card-head">
          <div>
            <p className="oferta-nome">{oferta.nome}</p>
            <p className="oferta-dominio">SSW {oferta.dominio || '—'}</p>
          </div>
          <span className="oferta-badge oferta-badge--erro">Indisponível</span>
        </header>
        <p className="oferta-msg-erro">{oferta.mensagem || 'Sem cobertura para esta rota.'}</p>
      </article>
    )
  }

  return (
    <article className={`oferta-card ${selecionada ? 'oferta-card--selecionada' : ''}`}>
      <header className="oferta-card-head">
        <div>
          <p className="oferta-nome">{oferta.nome}</p>
          <p className="oferta-dominio">SSW {oferta.dominio || '—'}</p>
        </div>
        {!oferta.simulacao && oferta.numeroCotacao ? (
          <button
            type="button"
            className={`oferta-select ${selecionada ? 'is-active' : ''}`}
            onClick={onSelecionar}
          >
            {selecionada ? 'Selecionada' : 'Escolher'}
          </button>
        ) : null}
      </header>

      <div className="oferta-valores">
        <div>
          <p className="resultado-label">Valor do frete</p>
          <p className="resultado-total">{formatMoney(oferta.totalFrete)}</p>
        </div>
        <div className="resultado-meta">
          <div>
            <small>Prazo</small>
            <strong>{oferta.prazo} dia(s)</strong>
          </div>
          <div>
            <small>Nº cotação</small>
            <strong>{oferta.simulacao ? 'Simulação' : oferta.numeroCotacao || '—'}</strong>
          </div>
          {oferta.cnpjPagador ? (
            <div>
              <small>Pagador nesta tabela</small>
              <strong>{oferta.cnpjPagador}</strong>
            </div>
          ) : null}
        </div>
      </div>

      {detalhes.length > 0 && selecionada && (
        <div className="resultado-parcelas">
          <h3>Detalhamento das parcelas</h3>
          <ul>
            {detalhes.map(([key, value]) => (
              <li key={key}>
                <span>{DETALHE_LABELS[key] || key}</span>
                <span>{formatMoney(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selecionada && !coletaAberta && !oferta.simulacao && oferta.numeroCotacao && (
        <div className="resultado-coleta-actions">
          {numeroColeta ? (
            <p className="coleta-numero-inline">
              Coleta gerada no SSW: <strong>{numeroColeta}</strong>
            </p>
          ) : (
            <button type="button" className="btn-primary btn-coleta" onClick={onSolicitarColeta}>
              Solicitar coleta nesta transportadora
            </button>
          )}
        </div>
      )}

      {selecionada ? children : null}
    </article>
  )
}

function CotacaoResultado({
  resultado,
  ofertaSelecionadaId,
  onSelecionarOferta,
  coletaAberta,
  numeroColeta,
  onSolicitarColeta,
  children,
}) {
  const ofertas = Array.isArray(resultado?.ofertas) && resultado.ofertas.length > 0
    ? resultado.ofertas
    : resultado?.sucesso
      ? [resultado]
      : []

  const enviado = resultado?.enviado || ofertas.find((o) => o.enviado)?.enviado

  return (
    <section className="resultado-card" id="resultado-cotacao">
      <div className="ofertas-intro">
        <h2>Ofertas por transportadora</h2>
        <p>
          {resultado.simulacao
            ? 'Simulação comparativa. Entre com conta aprovada para gravar no SSW e solicitar coleta.'
            : 'Escolha a transportadora para seguir com a coleta. Cada tabela usa o CNPJ pagador correspondente.'}
        </p>
      </div>

      {enviado && (
        <div className="resultado-enviado">
          <h3>Dados da carga</h3>
          <ul>
            <li>
              <span>Volumes</span>
              <span>{enviado.quantidade}</span>
            </li>
            <li>
              <span>Peso total</span>
              <span>{enviado.peso} kg</span>
            </li>
            <li>
              <span>Cubagem total</span>
              <span>{enviado.volume} m³</span>
            </li>
            <li>
              <span>Valor da NF</span>
              <span>{formatMoney(enviado.valorNF)}</span>
            </li>
          </ul>
        </div>
      )}

      <div className="ofertas-grid">
        {ofertas.map((oferta) => {
          const id = oferta.transportadoraId || 'default'
          const selecionada = ofertaSelecionadaId === id
          return (
            <OfertaCard
              key={id}
              oferta={oferta}
              selecionada={selecionada}
              onSelecionar={() => onSelecionarOferta?.(id)}
              coletaAberta={coletaAberta && selecionada}
              numeroColeta={selecionada ? numeroColeta : null}
              onSolicitarColeta={onSolicitarColeta}
            >
              {selecionada ? children : null}
            </OfertaCard>
          )
        })}
      </div>
    </section>
  )
}

export default CotacaoResultado
