import { useState } from 'react'

/* Muestra la foto del plato; si el archivo no existe, un fondo con emoji. */
export default function FotoPlato({ plato, className = 'plato__foto' }) {
  const [fallo, setFallo] = useState(false)

  if (fallo) {
    return (
      <div className={`${className} ${className}--vacia`} aria-hidden="true">
        {plato.emoji}
      </div>
    )
  }
  return (
    <img
      className={className}
      src={plato.imagen}
      alt={plato.nombre}
      loading="lazy"
      onError={() => setFallo(true)}
    />
  )
}