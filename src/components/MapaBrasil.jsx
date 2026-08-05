import { useEffect, useRef } from 'react'
import mapaSvg from '../assets/mapa-brasil.svg?raw'
import './MapaBrasil.css'

function MapaBrasil() {
  const ref = useRef(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return undefined

    function onClick(event) {
      const link = event.target.closest('a')
      if (link) event.preventDefault()
    }

    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [])

  return (
    <div
      className="mapa-brasil"
      ref={ref}
      dangerouslySetInnerHTML={{ __html: mapaSvg }}
      aria-label="Mapa do Brasil — cobertura Jetlu"
      role="img"
    />
  )
}

export default MapaBrasil
