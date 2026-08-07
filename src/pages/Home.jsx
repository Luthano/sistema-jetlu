import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import './Home.css'
import './HomeAnimations.css'

const PILARES = [
  {
    title: 'Coleta ágil',
    text: 'Coletas diárias que poupam o tempo da sua operação.',
    icon: '/home/caminhao.svg',
  },
  {
    title: 'Entrega eficiente',
    text: 'Envios locais e nacionais com rastreio em tempo real.',
    icon: '/home/entrega.svg',
  },
  {
    title: 'Visão de negócio',
    text: 'Logística inteligente, alinhada ao ritmo da sua empresa.',
    icon: '/home/eficiencia.svg',
  },
]

const DIFERENCIAIS = [
  { text: 'Operação acelerada, que faz acontecer.', icon: '/home/foguete.svg' },
  { text: 'Mais de 600 cidades atendidas em 12 estados + DF', icon: '/home/icone-jetlu.svg' },
  { text: 'Coletas diárias que poupam seu tempo.', icon: '/home/caminhao.svg' },
  { text: 'Atendimento próximo e resolutivo.', icon: '/home/icone-jetlu-contorno.svg' },
  { text: 'Entregas locais e nacionais com rastreio', icon: '/home/entrega.svg' },
  { text: 'Logística com visão, alinhada ao seu negócio.', icon: '/home/eficiencia.svg' },
]

const SOLUCOES = [
  {
    title: 'Cascavel, Maringá e Londrina',
    subtitle: 'Coletas locais',
    image: '/home/velocidade-2.png',
  },
  {
    title: 'Coleta, Transporte e Entrega',
    subtitle: 'Entrega eficiente',
    image: '/home/banner-caixa.png',
  },
  {
    title: 'Mais de 600 cidades',
    subtitle: 'Alcance nacional',
    image: '/home/banner-collage.png',
  },
]

function Home() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <img
          className="landing-hero-bg"
          src="/home/banner-site-4.png"
          alt=""
          aria-hidden="true"
        />
        <div className="landing-hero-overlay" />
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
            <Link to="/rastrear" className="landing-cta landing-cta-outline">
              Rastrear encomenda
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section landing-pillars">
        <div className="landing-wrap landing-pillars-grid">
          {PILARES.map((item, index) => (
            <Reveal key={item.title} delay={index * 70} as="article" className="landing-pillar">
              <img src={item.icon} alt="" />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="landing-section landing-diff">
        <div className="landing-wrap landing-diff-grid">
          <Reveal className="landing-diff-visual">
            <img src="/home/velocidade-2.png" alt="" />
          </Reveal>
          <div className="landing-diff-content">
            <Reveal>
              <p className="landing-eyebrow light">Logística acelerada</p>
              <h2>Enquanto alguns planejam, a Jetlu faz!</h2>
            </Reveal>
            <div className="landing-diff-cards">
              {DIFERENCIAIS.map((item, index) => (
                <Reveal key={item.text} delay={index * 50} as="article" className="landing-diff-card">
                  <img className="landing-diff-icon" src={item.icon} alt="" />
                  <p>{item.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-solutions">
        <div className="landing-wrap">
          <Reveal className="landing-section-head">
            <p className="landing-eyebrow">Soluções</p>
            <h2>Soluções para empresas aceleradas.</h2>
            <p className="landing-lead">Logística com visão, alinhada ao seu negócio.</p>
          </Reveal>
          <div className="landing-cards">
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

      <section className="landing-section landing-about">
        <div className="landing-wrap landing-about-grid">
          <Reveal>
            <p className="landing-eyebrow">Acelerados</p>
            <h2>Envios rápidos e seguros para todo o Brasil!</h2>
            <p>
              A Jetlu é sinônimo de eficiência e tecnologia no transporte de encomendas.
            </p>
            <p>
              Com uma operação inteligente e uma rede de distribuição em expansão, oferecemos
              soluções logísticas sob medida para quem precisa de resultados reais.
            </p>
            <p className="landing-about-highlight">
              Logística que pensa como empresa, não só como transportadora.
            </p>
            <div className="landing-about-actions">
              <Link to="/cidades-atendidas" className="landing-cta landing-cta-navy">
                Ver cidades atendidas
              </Link>
              <Link to="/cotacao" className="landing-cta">
                Calcular frete
              </Link>
            </div>
          </Reveal>
          <Reveal delay={100} className="landing-about-visual">
            <img src="/home/banner-sobre.png" alt="Operação Jetlu" />
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
            <a
              href="mailto:operacional@jetlu.com.br?subject=Cadastro%20de%20veiculo%20parceiro"
              className="landing-join-card landing-join-photo"
              style={{ backgroundImage: 'url(/home/banner-site-7.png)' }}
            >
              <div>
                <h3>Cadastre seu veículo</h3>
                <p>Transforme seu veículo em uma fonte de faturamento, sendo parceiro da Jetlu.</p>
                <span className="landing-join-btn">Cadastrar veículo</span>
              </div>
            </a>
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
          <Link to="/cotacao" className="landing-cta">
            Fazer cotação
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
