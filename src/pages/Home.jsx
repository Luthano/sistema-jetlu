import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import './Home.css'
import './HomeAnimations.css'
import './HubLogistico.css'

const STATS = [
  { value: '900+', label: 'cidades atendidas na malha Jetlu' },
  { value: '12', label: 'estados + DF com cobertura ativa' },
  { value: 'D+1', label: 'prazos ágeis em rotas estratégicas' },
  { value: '3', label: 'pilares: coleta, entrega e visão de negócio' },
]

const PILARES = [
  {
    title: 'Coleta ágil',
    text: 'Coletas diárias que poupam o tempo da sua operação e mantêm o fluxo em movimento.',
    icon: '/home/caminhao.svg',
  },
  {
    title: 'Entrega eficiente',
    text: 'Envios locais e nacionais com rastreio em tempo real e prazos claros.',
    icon: '/home/entrega.svg',
  },
  {
    title: 'Visão de negócio',
    text: 'Logística inteligente, alinhada ao ritmo da sua empresa — não só transporte.',
    icon: '/home/eficiencia.svg',
  },
  {
    title: 'Operação acelerada',
    text: 'Enquanto alguns planejam, a Jetlu faz: velocidade com controle e proximidade.',
    icon: '/home/foguete.svg',
  },
]

const BENEFICIOS = [
  {
    title: 'Mais de 900 cidades',
    text: 'Cobertura em 11 estados + DF para ampliar o alcance do seu embarque.',
  },
  {
    title: 'Coletas que poupam tempo',
    text: 'Rotina operacional enxuta, com coleta diária e menos atrito no dia a dia.',
  },
  {
    title: 'Rastreio ponta a ponta',
    text: 'Acompanhe a encomenda e responda o cliente com informação clara.',
  },
  {
    title: 'Atendimento resolutivo',
    text: 'Time próximo, focado em destravar a operação quando você mais precisa.',
  },
]

const SOLUCOES = [
  {
    title: 'Cascavel, Maringá e Londrina',
    subtitle: 'Coletas locais',
    image: '/home/velocidade-2.png',
  },
  {
    title: 'Coleta, transporte e entrega',
    subtitle: 'Entrega eficiente',
    image: '/home/banner-caixa.png',
  },
  {
    title: 'Mais de 900 cidades',
    subtitle: 'Alcance nacional',
    image: '/home/banner-collage.png',
  },
]

const PASSOS = [
  {
    step: '01',
    title: 'Crie sua conta',
    text: 'Acesse o painel Jetlu e complete o cadastro para liberar cotação e histórico.',
  },
  {
    step: '02',
    title: 'Consulte a cobertura',
    text: 'Valide origem e destino na malha — rota direta ou redespacho com parceiros.',
  },
  {
    step: '03',
    title: 'Cote o frete',
    text: 'Informe volumes e documentos. Compare ofertas e escolha a melhor opção.',
  },
  {
    step: '04',
    title: 'Solicite a coleta',
    text: 'Com a cotação aprovada, acione a coleta e acompanhe o andamento.',
  },
  {
    step: '05',
    title: 'Rastreie a entrega',
    text: 'Consulte DANFE ou NF + documento e acompanhe os eventos até o destino.',
  },
]

const MODULOS = [
  {
    title: 'Cotação',
    text: 'Simule frete com Jetlu e parceiros em um só fluxo.',
    to: '/cotacao',
    cta: 'Fazer cotação',
  },
  {
    title: 'Rastrear',
    text: 'Localize encomendas por DANFE ou NF + documento.',
    to: '/rastrear',
    cta: 'Rastrear agora',
  },
  {
    title: 'Cidades atendidas',
    text: 'Consulte cobertura e entenda a rota antes de embarcar.',
    to: '/cidades-atendidas',
    cta: 'Ver cobertura',
  },
  {
    title: 'Hub logístico',
    text: 'Conheça a malha, o fluxo e os diferenciais da operação Jetlu.',
    to: '/hub-logistico',
    cta: 'Abrir hub',
  },
]

function Home() {
  return (
    <div className="landing hub-landing">
      <section className="landing-hero hub-hero">
        <img
          className="landing-hero-bg"
          src="/home/banner-site-4.png"
          alt=""
          aria-hidden="true"
        />
        <div className="landing-hero-overlay hub-hero-overlay" />
        <div className="landing-hero-content">
          <img className="landing-hero-logo" src="/home/logo-jetlu.svg" alt="Jetlu" />
          <h1>Logística acelerada, que faz acontecer.</h1>
          <p className="landing-hero-lead">
            Se sua empresa exige mais da logística — mais agilidade, mais controle, mais visão —
            a Jetlu entrega.
          </p>
          <div className="landing-hero-actions">
            <Link to="/cotacao" className="landing-cta">
              Fazer cotação
            </Link>
            <Link to="/cidades-atendidas" className="landing-cta landing-cta-outline">
              Cidades atendidas
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section hub-problem">
        <div className="landing-wrap hub-problem-grid">
          <Reveal>
            <p className="landing-eyebrow">Por que Jetlu</p>
            <h2>Enquanto alguns planejam, a Jetlu faz</h2>
            <p className="landing-lead">
              Logística com visão de negócio: coleta ágil, entrega eficiente e uma malha em
              expansão para quem precisa de resultado real — não de promessa.
            </p>
          </Reveal>
          <div className="hub-stats">
            {STATS.map((item, index) => (
              <Reveal key={item.label} delay={index * 60} as="article" className="hub-stat">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="hub-urgency">
        <div className="landing-wrap hub-urgency-inner">
          <Reveal>
            <h2>Sua operação precisa de velocidade. Seu cliente, de previsibilidade.</h2>
            <p>
              Cotação, cobertura, coleta e rastreio no ecossistema Jetlu — para reduzir atrito
              e acelerar a resposta do seu time.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <Link to="/hub-logistico" className="landing-cta">
              Conhecer o Hub
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="landing-section hub-pillars-section">
        <div className="landing-wrap">
          <Reveal className="landing-section-head">
            <p className="landing-eyebrow">Pilares</p>
            <h2>Logística acelerada em quatro frentes</h2>
            <p className="landing-lead">
              Do primeiro contato à entrega, a Jetlu combina operação e tecnologia para
              empresas que não podem perder tempo.
            </p>
          </Reveal>
          <div className="hub-pillars">
            {PILARES.map((item, index) => (
              <Reveal key={item.title} delay={index * 70} as="article" className="hub-pillar">
                <img src={item.icon} alt="" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section hub-story">
        <div className="landing-wrap hub-story-grid">
          <Reveal className="hub-story-visual">
            <img src="/home/banner-sobre.png" alt="Operação Jetlu" />
          </Reveal>
          <Reveal delay={80} className="hub-story-copy">
            <p className="landing-eyebrow">Acelerados</p>
            <h2>Envios rápidos e seguros para todo o Brasil</h2>
            <p>
              A Jetlu é sinônimo de eficiência e tecnologia no transporte de encomendas. Com
              operação inteligente e rede em expansão, oferecemos soluções sob medida para quem
              precisa de resultados reais.
            </p>
            <ul className="hub-story-list">
              <li>Logística que pensa como empresa, não só como transportadora</li>
              <li>Coletas em polos estratégicos do Paraná e alcance nacional</li>
              <li>Plataforma digital para cotar, rastrear e consultar cobertura</li>
            </ul>
            <div className="hub-inline-cta">
              <Link to="/cidades-atendidas" className="landing-cta landing-cta-navy">
                Ver cidades atendidas
              </Link>
              <Link to="/cotacao" className="landing-cta">
                Calcular frete
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="landing-section hub-benefits">
        <div className="landing-wrap hub-benefits-grid">
          <Reveal className="hub-benefits-copy">
            <p className="landing-eyebrow light">Diferenciais</p>
            <h2>Operação acelerada, que faz acontecer</h2>
            <p>
              Cobertura ampla, coleta diária, rastreio e atendimento próximo — tudo alinhado
              ao ritmo do seu negócio.
            </p>
            <Link to="/cotacao" className="landing-cta">
              Fazer cotação
            </Link>
          </Reveal>
          <div className="hub-benefits-list">
            {BENEFICIOS.map((item, index) => (
              <Reveal key={item.title} delay={index * 50} as="article" className="hub-benefit">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section hub-audience">
        <div className="landing-wrap">
          <Reveal className="landing-section-head">
            <p className="landing-eyebrow">Soluções</p>
            <h2>Soluções para empresas aceleradas</h2>
            <p className="landing-lead">Logística com visão, alinhada ao seu negócio.</p>
          </Reveal>
          <div className="landing-cards home-solution-cards">
            {SOLUCOES.map((item, index) => (
              <Reveal key={item.title} delay={index * 80} as="article" className="landing-card">
                <img src={item.image} alt="" />
                <div className="landing-card-body">
                  <p>{item.subtitle}</p>
                  <h3>{item.title}</h3>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section hub-modules">
        <div className="landing-wrap">
          <Reveal className="landing-section-head">
            <p className="landing-eyebrow">Plataforma</p>
            <h2>Tudo o que você precisa, no mesmo lugar</h2>
            <p className="landing-lead">
              Cotação, rastreio, cobertura e Hub logístico — conectados à operação Jetlu.
            </p>
          </Reveal>
          <div className="hub-modules-grid">
            {MODULOS.map((item, index) => (
              <Reveal key={item.title} delay={index * 60} as="article" className="hub-module">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link to={item.to} className="hub-module-link">
                  {item.cta}
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section hub-steps-section">
        <div className="landing-wrap">
          <Reveal className="landing-section-head">
            <p className="landing-eyebrow">Como funciona</p>
            <h2>Do cadastro à entrega, em um fluxo claro</h2>
            <p className="landing-lead">
              Comece pela plataforma e deixe a Jetlu cuidar da conexão logística.
            </p>
          </Reveal>
          <ol className="hub-steps">
            {PASSOS.map((item, index) => (
              <Reveal key={item.step} delay={index * 60} as="li" className="hub-step">
                <span className="hub-step-num">{item.step}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={100} className="hub-inline-cta">
            <Link to="/cotacao" className="landing-cta">
              Começar agora
            </Link>
            <Link to="/painel" className="landing-cta landing-cta-navy">
              Ir ao painel
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="landing-section landing-partners">
        <Reveal className="landing-wrap landing-partners-inner">
          <p className="landing-eyebrow">Parcerias</p>
          <h2>Unimos forças com grandes transportadoras para oferecer a melhor cobertura logística.</h2>
          <p className="landing-lead">
            A Jetlu mantém parcerias com transportadoras confiáveis como Lopesul e Envia Rápido,
            que conectam rotas estratégicas ao nosso sistema logístico.
          </p>
          <div className="landing-partner-logos">
            <img src="/home/logo-lopesul.png" alt="Lopesul" />
            <img src="/home/logo-envia-rapido.png" alt="Envia Rápido" />
          </div>
        </Reveal>
      </section>

      <section className="landing-section landing-join">
        <div className="landing-wrap">
          <Reveal className="landing-section-head">
            <p className="landing-eyebrow">Seja parte da operação</p>
            <h2>Lucre com a Jetlu</h2>
          </Reveal>
          <div className="landing-join-grid">
            <a
              href="mailto:comercial@jetlu.com.br?subject=Quero%20ser%20franqueado%20Jetlu"
              className="landing-join-card landing-join-featured"
              style={{ backgroundImage: 'url(/home/banner-franqueado.png)' }}
            >
              <div>
                <h3>Seja um franqueado</h3>
                <p>Abra sua unidade Jetlu e tenha um negócio escalável com alta demanda.</p>
                <span className="landing-join-btn">Quero ser um franqueado</span>
              </div>
            </a>
            <Link
              to="/cadastrar-veiculo"
              className="landing-join-card landing-join-photo"
              style={{ backgroundImage: 'url(/home/banner-site-7.png)' }}
            >
              <div>
                <h3>Cadastre seu veículo</h3>
                <p>Transforme seu veículo em uma fonte de faturamento, sendo parceiro da Jetlu.</p>
                <span className="landing-join-btn">Cadastrar veículo</span>
              </div>
            </Link>
            <a
              href="mailto:comercial@jetlu.com.br?subject=Curriculo%20-%20Trabalhe%20na%20Jetlu"
              className="landing-join-card"
            >
              <img className="landing-join-mini-icon" src="/home/foguete.svg" alt="" />
              <h3>Trabalhe conosco</h3>
              <p>Faça parte de uma empresa inovadora e em crescimento no setor logístico.</p>
              <span className="landing-join-btn ghost">Enviar currículo</span>
            </a>
          </div>
        </div>
      </section>

      <section className="landing-banner-cta">
        <img className="landing-banner-cta-bg" src="/home/banner-blog.png" alt="" aria-hidden="true" />
        <div className="landing-wrap landing-banner-cta-inner">
          <h2>A logística acelerada que faz acontecer.</h2>
          <div className="hub-banner-actions">
            <Link to="/cotacao" className="landing-cta">
              Fazer cotação
            </Link>
            <Link to="/hub-logistico" className="landing-cta landing-cta-outline">
              Ver Hub logístico
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
