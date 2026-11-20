// Configuración de ejecución. Los valores salen de variables VITE_* (ver .env.example).
const entorno = import.meta.env ?? {}

// 'local' = localStorage (prototipo). 'api' = backend real (aún no implementado).
export const MODO_DATOS = entorno.VITE_MODO_DATOS ?? 'local'
export const API_URL = entorno.VITE_API_URL ?? 'http://localhost:5116/api'
