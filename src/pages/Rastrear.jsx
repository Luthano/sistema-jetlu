import RastreioPanel from '../components/RastreioPanel'
import './Rastrear.css'

function Rastrear() {
  return (
    <div className="rastrear-page">
      <header className="rastrear-hero">
        <p className="rastrear-kicker">Rastrear</p>
        <h1>Localize sua encomenda</h1>
        <p>
          Consulte pelo código DANFE da nota fiscal ou pelo CPF/CNPJ com o número da NF.
          Os dados vêm direto do SSW da Jetlu.
        </p>
      </header>

      <RastreioPanel />
    </div>
  )
}

export default Rastrear
