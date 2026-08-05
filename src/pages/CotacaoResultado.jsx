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

function CotacaoResultado({
  resultado,
  coletaAberta,
  numeroColeta,
  onSolicitarColeta,
  children,
}) {
  const detalhes = resultado?.detalhamento
    ? Object.entries(resultado.detalhamento).filter(([, value]) => Number(value) > 0)
    : []

  return (
    <section className="resultado-card" id="resultado-cotacao">
      <div className="resultado-hero">
        <div>
          <p className="resultado-label">Valor do frete</p>
          <p className="resultado-total">{formatMoney(resultado.totalFrete)}</p>
        </div>
        <div className="resultado-meta">
          <div>
            <small>Prazo</small>
            <strong>{resultado.prazo} dia(s)</strong>
          </div>
          <div>
            <small>Nº cotação</small>
            <strong>{resultado.simulacao ? 'Simulação' : resultado.numeroCotacao || '—'}</strong>
          </div>
          {resultado.enviado?.peso ? (
            <div>
              <small>Peso</small>
              <strong>{resultado.enviado.peso} kg</strong>
            </div>
          ) : null}
        </div>
      </div>

      {resultado.enviado && (
        <div className="resultado-enviado">
          <h3>Dados enviados ao SSW</h3>
          <ul>
            <li>
              <span>Volumes</span>
              <span>{resultado.enviado.quantidade}</span>
            </li>
            <li>
              <span>Peso total</span>
              <span>{resultado.enviado.peso} kg</span>
            </li>
            <li>
              <span>Cubagem total</span>
              <span>{resultado.enviado.volume} m³</span>
            </li>
            <li>
              <span>Valor da NF</span>
              <span>{formatMoney(resultado.enviado.valorNF)}</span>
            </li>
          </ul>
          {resultado.simulacao ? (
            <p className="resultado-nota">
              Esta é só uma simulação. Entre na conta aprovada para gravar o número no SSW e
              solicitar coleta.
            </p>
          ) : resultado.numeroCotacao ? (
            <p className="resultado-nota">
              Cotação <strong>{resultado.numeroCotacao}</strong> gravada no SSW. Use este
              número para a coleta.
            </p>
          ) : null}
        </div>
      )}

      {detalhes.length > 0 && (
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

      {!coletaAberta && !resultado.simulacao && resultado.numeroCotacao && (
        <div className="resultado-coleta-actions">
          {numeroColeta ? (
            <p className="coleta-numero-inline">
              Coleta gerada no SSW: <strong>{numeroColeta}</strong>
            </p>
          ) : (
            <button type="button" className="btn-primary btn-coleta" onClick={onSolicitarColeta}>
              Solicitar coleta
            </button>
          )}
        </div>
      )}

      {children}
    </section>
  )
}

export default CotacaoResultado
