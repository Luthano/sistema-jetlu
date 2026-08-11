import { Link } from 'react-router-dom'
import './SiteFooter.css'

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-wrap">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <img src="/home/logo-jetlu.svg" alt="Jetlu" />
            <p>A logística acelerada que faz acontecer.</p>
          </div>

          <div className="site-footer-col">
            <h3>Sistema</h3>
            <Link to="/cotacao">Cotação</Link>
            <Link to="/rastrear">Rastrear encomenda</Link>
            <Link to="/cidades-atendidas">Cidades atendidas</Link>
            <Link to="/cadastrar-veiculo">Cadastrar veículo</Link>
            <Link to="/painel">Painel</Link>
          </div>

          <div className="site-footer-col">
            <h3>Contato</h3>
            <a href="mailto:comercial@jetlu.com.br">comercial@jetlu.com.br</a>
            <a href="mailto:operacional@jetlu.com.br">operacional@jetlu.com.br</a>
            <a href="https://jetlu.com.br" target="_blank" rel="noreferrer">
              jetlu.com.br
            </a>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p>© {new Date().getFullYear()} Jetlu. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
