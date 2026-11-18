import { useEffect, useRef, useState } from 'react'
import { calcularEstadisticasMercados } from './Buscador/estadisticasMercados.js'
import { BackendService } from './services/backendService.js'
import Login from './InicioSesion/Login.jsx'
import Home from './Home/Home.jsx'
import Perfil from './Perfil/Perfil.jsx'
import AdminPanel from './Perfil/AdminPanel.jsx'
import RegistroPrecios from './Perfil/RegistroPrecios.jsx'
import { limpiarClasificarPrecios } from './Perfil/precios.js'
import Buscador from './Buscador/Buscador.jsx'
import Mercados from './Mercados/Mercados.jsx'
import PlatoDetalle from './DetallePlato/PlatoDetalle.jsx'
import Opinion from './DetallePlato/Opinion.jsx'
import Registro from './InicioSesion/Registro.jsx'
import {
  actualizarCuenta,
  cargarSesion,
  eliminarSesion,
  guardarSesion,
} from './InicioSesion/cuentas.js'
import { PLATOS } from './data/platos.js'
import { puedeAdministrar } from './services/permisos.js'
import ListaCompras from './Compras/ListaCompras.jsx'
import ResumenAhorro from './Finanzas/ResumenAhorro.jsx'
import Configuracion from './Recordatorios/Configuracion.jsx'
import { CONFIG_INICIAL, comprobarRecordatorio } from './Recordatorios/recordatorios.js'
import { generarListaCompras } from './Compras/listaCompras.js'
import {
  UBICACION_INICIAL,
  almacenCalificaciones,
  cargarCalificacionesMercados,
  cargarDatosPorUsuario,
  cargarOpiniones,
  cargarPreciosRegistrados,
  cargarUbicacion,
  guardarCalificacionesMercados,
  guardarOpiniones,
  guardarPreciosRegistrados,
  guardarUbicacion as persistirUbicacion,
  suscribirCalificaciones,
} from './services/repositorio.js'

function App() {
  const [ubicacionInicial] = useState(cargarUbicacion)
  const [sesionInicial] = useState(cargarSesion)
  const [usuario, setUsuario] = useState(sesionInicial.usuario)
  const [mostrarRegistro, setMostrarRegistro] = useState(false)
  const [pantalla, setPantalla] = useState(ubicacionInicial.pantalla)
  const [tab, setTab] = useState(ubicacionInicial.tab)
  const [platoId, setPlatoId] = useState(ubicacionInicial.platoId)
  const [personasPlato, setPersonasPlato] = useState(ubicacionInicial.personasPlato)
  const [busqueda, setBusqueda] = useState(ubicacionInicial.busqueda)
  
  const [guardados, setGuardados] = useState([]) 
  const [recetasApi, setRecetasApi] = useState([])
  const [mercadosApi, setMercadosApi] = useState([])
  
  const [perfilSalud, setPerfilSalud] = useState(sesionInicial.perfilSalud || { alergias: [], condiciones: [] })
  const [preciosRegistrados, setPreciosRegistrados] = useState(cargarPreciosRegistrados)
  const [calificacionesMercados, setCalificacionesMercados] = useState(() => cargarCalificacionesMercados(sesionInicial.usuario))
  const [, setVersionCalificacionesMercados] = useState(0)
  const [opiniones, setOpiniones] = useState([])
  const [datosIniciales] = useState(() => cargarDatosPorUsuario(sesionInicial.usuario))
  const [listaCompras, setListaCompras] = useState(datosIniciales.listaCompras)
  const [historialAhorro, setHistorialAhorro] = useState(datosIniciales.historialAhorro)
  const [recordatorios, setRecordatorios] = useState(datosIniciales.recordatorios || CONFIG_INICIAL)
  const [presupuestoBase, setPresupuestoBase] = useState(datosIniciales.presupuestoBase || '')
  
  const pasosNavegacion = useRef(ubicacionInicial.indice)
  const ubicacionActual = useRef(null)

  const estadisticasMercados = calcularEstadisticasMercados(almacenCalificaciones(), usuario, calificacionesMercados)

  const platoMock = PLATOS.find((p) => p.id === platoId) || {};
  const platoApi = recetasApi.find((p) => p.id === platoId);

  const plato = platoApi
      ? {
          ...platoApi,
          detalle: platoApi.descripcion,
          porciones: 1,
          minutos: platoApi.tiempo ?? platoApi.tiempoPrep ?? 25,
          ingredientes: platoApi.ingredientes || [],
          etiquetas: [
            platoApi.aptoAnemia ? 'Rico en hierro' : null,
            platoApi.aptoSinGluten ? 'Sin gluten' : null,
            (platoApi.precio ?? platoApi.costoEstimado ?? 0) <= 10 ? 'Económico' : null,
          ].filter(Boolean),
        }
      : PLATOS.find((p) => p.id === platoId) || null;
  
  ubicacionActual.current = { pantalla, tab, platoId, personasPlato, busqueda }

  const guardarUbicacion = (siguiente = {}) => {
    persistirUbicacion({
      ...ubicacionActual.current,
      indice: pasosNavegacion.current,
      ...siguiente,
    })
  }

  // Se ejecuta UNA SOLA VEZ cuando el usuario entra (por el arreglo [usuario?.id])
  useEffect(() => {
    if (!usuario || !usuario.id) return;

    const cargarDatosDelBackend = async () => {
      try {
        const cat = await BackendService.obtenerRecomendaciones(usuario.id);
        setRecetasApi(cat || []);

        const favs = await BackendService.obtenerFavoritos(usuario.id);
        if (Array.isArray(favs)) setGuardados(favs);

        const mercados = await BackendService.obtenerMercados();
        setMercadosApi(Array.isArray(mercados) ? mercados : []);
        if (Array.isArray(mercados) && mercados.length > 0) {
          const preciosDesdeBd = mercados.flatMap((m) =>
            (m.precios || []).map((p) => ({
              mercado: m.nombre,
              ingrediente: p.productoNombre,
              producto: p.productoNombre,
              precio: p.precio,
              unidad: 'kg',
              valido: p.precio > 0,
            }))
          );
          if (preciosDesdeBd.length > 0) setPreciosRegistrados(preciosDesdeBd);
        }

        const ahorro = await BackendService.obtenerResumenAhorro(usuario.id);
        if (ahorro && Array.isArray(ahorro.detalle)) {
          const historialMapeado = ahorro.detalle.map((item, idx) => ({
            listaId: idx + 1,
            fecha: item.fecha,
            plato: item.receta,
            mercado: 'Mercado Local',
            ahorro: item.ahorroEnEstaPreparacion,
          }));
          setHistorialAhorro(historialMapeado);
        }
      } catch (err) {
        console.warn('Error al cargar datos iniciales del backend:', err);
      }
    };
    cargarDatosDelBackend();
  }, [usuario?.id]);

  const handleToggleGuardado = async (recetaId) => {
    if (!usuario || !usuario.id) return;
    const yaEstaGuardado = guardados.includes(recetaId);
    setGuardados((prev) => yaEstaGuardado ? prev.filter((id) => id !== recetaId) : [...prev, recetaId]);
    try {
      if (yaEstaGuardado) await BackendService.eliminarFavorito(usuario.id, recetaId);
      else await BackendService.guardarFavorito(usuario.id, recetaId);
    } catch (error) {
      setGuardados((prev) => yaEstaGuardado ? [...prev, recetaId] : prev.filter((id) => id !== recetaId));
    }
  };

  useEffect(() => {
    if (usuario) guardarSesion(usuario, perfilSalud)
    else eliminarSesion()
  }, [usuario, perfilSalud])

  useEffect(() => { guardarPreciosRegistrados(preciosRegistrados) }, [preciosRegistrados])
  useEffect(() => { guardarOpiniones(opiniones) }, [opiniones])

  useEffect(() => { window.scrollTo(0, 0) }, [pantalla, tab])

  useEffect(() => {
    const estadoInicial = {
      platomatch: true,
      indice: ubicacionInicial.indice,
      pantalla: ubicacionInicial.pantalla,
      tab: ubicacionInicial.tab,
      platoId: ubicacionInicial.platoId,
      personasPlato: ubicacionInicial.personasPlato,
    }
    window.history.replaceState(estadoInicial, '')

    const restaurarPaso = (event) => {
      if (!event.state?.platomatch) return
      pasosNavegacion.current = event.state.indice
      setPantalla(event.state.pantalla)
      setTab(event.state.tab)
      setPlatoId(event.state.platoId)
      setPersonasPlato(event.state.personasPlato ?? 1)
      guardarUbicacion({
        pantalla: event.state.pantalla,
        tab: event.state.tab,
        platoId: event.state.platoId,
        personasPlato: event.state.personasPlato ?? 1,
        indice: event.state.indice,
      })
    }
    window.addEventListener('popstate', restaurarPaso)
    return () => window.removeEventListener('popstate', restaurarPaso)
  }, [])

  useEffect(() => { guardarUbicacion() }, [pantalla, tab, platoId, personasPlato, busqueda])

  const navegar = (siguientePantalla, siguienteTab, siguientePlatoId = null, adicionales = {}) => {
    const siguienteIndice = pasosNavegacion.current + 1
    const siguienteEstado = {
      platomatch: true,
      indice: siguienteIndice,
      pantalla: siguientePantalla,
      tab: siguienteTab,
      platoId: siguientePlatoId,
      personasPlato: adicionales.personasPlato ?? personasPlato,
    }
    window.history.pushState(siguienteEstado, '')
    pasosNavegacion.current = siguienteIndice
    setPantalla(siguientePantalla)
    setTab(siguienteTab)
    setPlatoId(siguientePlatoId)
    guardarUbicacion({ ...siguienteEstado, ...adicionales })
  }

  const volver = (pantallaRespaldo, tabRespaldo = tab) => {
    if (pasosNavegacion.current > 0) {
      window.history.back()
      return
    }
    navegar(pantallaRespaldo, tabRespaldo, pantallaRespaldo === 'detalle' ? platoId : null)
  }

  const guardarSalud = async (nuevoPerfil) => {
    setPerfilSalud(nuevoPerfil);
    if (!usuario?.id) return;
    const restriccionesTexto = [...(nuevoPerfil.condiciones || []), ...(nuevoPerfil.alergias || [])].join(', ');
    try {
      await BackendService.actualizarPerfil(usuario.id, {
        presupuesto: Number(presupuestoBase) || 50,
        cantidadPersonas: personasPlato || 1,
        restriccionesSalud: restriccionesTexto,
      });
      // Solo pedimos las recetas cuando el usuario explícitamente cambia y guarda su perfil.
      const cat = await BackendService.obtenerRecomendaciones(usuario.id);
      setRecetasApi(cat || []);
    } catch (err) {}
  };

  const guardarPresupuestoBase = async (nuevoPresupuesto) => {
    setPresupuestoBase(nuevoPresupuesto);
    if (!usuario?.id || Number(nuevoPresupuesto) <= 0) return;
    const restriccionesTexto = [...(perfilSalud?.condiciones || []), ...(perfilSalud?.alergias || [])].join(', ');
    try {
      await BackendService.actualizarPerfil(usuario.id, {
        presupuesto: Number(nuevoPresupuesto),
        cantidadPersonas: personasPlato || 1,
        restriccionesSalud: restriccionesTexto,
      });
      // Solo pedimos las recetas cuando el usuario explícitamente cambia y guarda su presupuesto.
      const cat = await BackendService.obtenerRecomendaciones(usuario.id);
      setRecetasApi(cat || []);
    } catch (err) {}
  };

  const generarCompras = async (platoElegido, personas = 1) => {
    if (!usuario?.id) return;
    try {
      const res = await BackendService.generarListaCompras(usuario.id, platoElegido.id);
      const seguimiento = await BackendService.obtenerSeguimientoCompras(res.listaId);

      const listaAdaptada = {
        id: seguimiento.listaId,
        platoId: platoElegido.id,
        nombre: seguimiento.recetaNombre,
        personas: personas,
        fecha: new Date().toISOString(),
        ingredientes: [
          ...seguimiento.pendientes.map((item) => ({
            id: item.id,
            nombre: item.ingrediente,
            cantidad: `${item.cantidad} ${item.unidadMedida}`,
            precio: item.precioEstimado,
            comprado: false,
            enCasa: false,
          })),
          ...seguimiento.comprados.map((item) => ({
            id: item.id,
            nombre: item.ingrediente,
            cantidad: `${item.cantidad} ${item.unidadMedida}`,
            precio: item.precioEstimado,
            comprado: true,
            enCasa: false,
          })),
        ],
      };
      setListaCompras(listaAdaptada);
    } catch (err) {
      const nueva = generarListaCompras(platoElegido, personas, busqueda.ingredientes);
      setListaCompras(nueva);
    }
    navegar('compras', tab, platoElegido.id);
  };

  const marcarComprado = async (id) => {
    const item = listaCompras?.ingredientes.find((i) => i.id === id);
    const nuevoEstado = item ? !item.comprado : true;

    setListaCompras((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.map((i) => i.id === id ? { ...i, comprado: nuevoEstado } : i),
    }));

    if (typeof id === 'number') {
      try {
        await BackendService.marcarItemComprado(id, nuevoEstado);
      } catch (err) {}
    }
  };

  const registrarAhorro = async (registro) => {
    setHistorialAhorro((prev) => prev.some((r) => r.listaId === registro.listaId) ? prev : [registro, ...prev]);
    if (!usuario?.id) return;
    try {
      const costo = Number(registro.costoElegido || 15);
      await BackendService.registrarPreparacion(usuario.id, registro.platoId, costo);
    } catch (err) {
      console.error('Error al registrar ahorro:', err);
    }
  };

  const irATab = (t) => navegar('home', t)
  
  const verPlato = async (id, personas = 1) => {
    setPersonasPlato(personas);
    try {
      const detalle = await BackendService.obtenerDetalleReceta(id);
      if (detalle) {
        setRecetasApi((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  nombre: detalle.nombre ?? r.nombre,
                  descripcion: detalle.descripcion ?? r.descripcion,
                  detalle: detalle.descripcion ?? r.descripcion,
                  precio: detalle.costoEstimado ?? r.precio,
                  kcal: detalle.calorias ?? r.kcal,
                  minutos: detalle.tiempoPrep ?? r.tiempo,
                  ingredientes: Array.isArray(detalle.ingredientes)
                    ? detalle.ingredientes.map((ing) => ({
                        nombre: ing.nombreIngrediente,
                        cantidad: `${ing.cantidadBase} ${ing.unidadMedida}`,
                        cantidadBase: ing.cantidadBase,
                        unidad: ing.unidadMedida,
                      }))
                    : [],
                }
              : r
          )
        );
      }
    } catch (err) {}
    navegar('detalle', tab, id, { personasPlato: personas });
  };

  const limpiarPrecios = () => {
    const resultado = limpiarClasificarPrecios(preciosRegistrados)
    setPreciosRegistrados(resultado.registros)
    return resultado
  }

  const calificarMercado = (mercado, calificacion) => {
    setCalificacionesMercados((actuales) => ({ ...actuales, [mercado]: calificacion }))
  }

  const actualizarUsuario = async (actualizacion) => {
    if (!usuario?.email) throw new Error('Inicia sesión para cambiar correo o contraseña.')
    const usuarioActualizado = await actualizarCuenta({ ...actualizacion, emailActual: usuario.email })
    setUsuario((actual) => ({ ...actual, ...usuarioActualizado }))
    return usuarioActualizado
  }

  const cerrarSesion = () => {
    eliminarSesion()
    pasosNavegacion.current = 0
    window.history.replaceState({ platomatch: true, indice: 0, pantalla: 'home', tab: 'inicio', platoId: null }, '')
    persistirUbicacion(UBICACION_INICIAL)
    setUsuario(null)
    setPantalla('home')
    setTab('inicio')
    setPlatoId(null)
    setBusqueda({ presupuesto: '', ingredientes: '', personas: 1 })
    setPersonasPlato(1)
    setGuardados([])
    setCalificacionesMercados({})
    setListaCompras(null)
    setHistorialAhorro([])
    setRecordatorios(CONFIG_INICIAL)
    setPresupuestoBase('')
    setPerfilSalud({ alergias: [], condiciones: [] })
  }

  const registrarOpinion = async (opinion) => {
    if (!usuario?.id) return;
    const textoCompleto = [opinion.destacados?.length ? `[${opinion.destacados.join(', ')}]` : '', opinion.comentario].filter(Boolean).join(' - ');
    setOpiniones((prev) => [
      {
        ...opinion,
        id: window.crypto.randomUUID(),
        platoNombre: PLATOS.find((item) => item.id === opinion.platoId)?.nombre ?? 'Plato',
        usuario: usuario?.nombre ?? 'Usuario',
        email: usuario?.email ?? null,
        fecha: new Date().toISOString(),
      },
      ...prev,
    ]);
    try {
      await BackendService.enviarFeedback(usuario.id, opinion.platoId, Number(opinion.calificacion), textoCompleto || 'Sin comentarios adicionales');
    } catch (err) { }
  };

  if (!usuario) {
    if (mostrarRegistro) {
      return (
        <Registro
          onVolver={() => setMostrarRegistro(false)}
          onCrearCuenta={async (datosCuenta) => {
            try {
              const restriccionesTexto = [...(datosCuenta.perfilSalud?.condiciones || []), ...(datosCuenta.perfilSalud?.alergias || [])].join(', ');
              const respuesta = await BackendService.registrar({
                nombre: datosCuenta.nombre,
                correo: datosCuenta.email,
                contrasena: datosCuenta.password,
                presupuesto: 50,
                cantidadPersonas: 1,
                restriccionesSalud: restriccionesTexto
              });
              const idReal = respuesta.usuarioId || respuesta.id;
              const nuevoUsuario = {
                id: idReal,
                nombre: datosCuenta.nombre,
                email: datosCuenta.email,
                presupuesto: 50,
                rol: datosCuenta.email.toLowerCase().includes('admin') || datosCuenta.email.toLowerCase().endsWith('@platomatch.pe') ? 'admin' : 'usuario'
              };
              setPresupuestoBase('50');
              setPerfilSalud(datosCuenta.perfilSalud || { alergias: [], condiciones: [] });
              setGuardados([]);
              setUsuario(nuevoUsuario); 
              setMostrarRegistro(false);
            } catch (error) {
              alert(error.message || 'No se pudo registrar en la BD.');
            }
          }}
        />
      );
    }
    return (
      <Login
        onLogin={async ({ email, password }) => {
          try {
            const res = await BackendService.login(email, password);
            const u = res.usuario || res;
            const usuarioAutenticado = {
              id: u.id,
              nombre: u.nombre,
              email: u.correo || email,
              rol: u.correo?.includes('admin') ? 'admin' : 'usuario'
            };
            setUsuario(usuarioAutenticado);
            if (u.presupuesto) setPresupuestoBase(String(u.presupuesto));
            if (u.restriccionesSalud) {
              setPerfilSalud({
                alergias: u.restriccionesSalud.includes('Gluten') ? ['Gluten'] : [],
                condiciones: u.restriccionesSalud.includes('Anemia') ? ['Anemia'] : []
              });
            }
            return true;
          } catch (error) {
            return false;
          }
        }}
        onGuest={() => {
          setUsuario({ id: 0, nombre: 'Viajero Saludable', invitado: true });
          setGuardados([]);
          setCalificacionesMercados({});
          setPerfilSalud({ alergias: [], condiciones: [] });
        }}
        onRegister={() => setMostrarRegistro(true)}
      />
    );
  }

  if (pantalla === 'compras') {
    return <ListaCompras lista={listaCompras} preciosRegistrados={preciosRegistrados}
      historial={historialAhorro} onMarcar={marcarComprado}
      onVolver={() => navegar('home', 'perfil')} onVerRecetas={() => navegar('home', 'buscar')}
      onRegistrarAhorro={registrarAhorro} onVerAhorro={() => navegar('ahorro', 'perfil')} />
  }

  if (pantalla === 'ahorro') {
    return <ResumenAhorro historial={historialAhorro}
      onVolver={() => navegar('home', 'perfil')} onCompras={() => navegar('compras', 'perfil')} />
  }
  if (pantalla === 'recordatorios') {
    return (
      <Configuracion
        configuracion={recordatorios}
        onGuardar={async (nuevaConfig) => {
          setRecordatorios(nuevaConfig);
          if (usuario?.id) {
            try {
              await BackendService.guardarRecordatorio(usuario.id, {
                horaAlerta: nuevaConfig.hora || '08:00',
                frecuencia: 'Diario',
                activo: Boolean(nuevaConfig.activo),
              });
            } catch (err) {}
          }
        }}
        onVolver={() => navegar('home', 'perfil')}
      />
    );
  }

  if (pantalla === 'detalle' && plato) {
    return (
      <PlatoDetalle
        plato={plato}
        personas={personasPlato}
        guardado={guardados.includes(plato.id)}
        onToggleGuardado={handleToggleGuardado}
        onVolver={() => volver('home', tab)}
        onNavegar={irATab}
        onOpinion={() => navegar('opinion', tab, plato.id)}
        perfilSalud={perfilSalud}
        onGenerarCompras={() => generarCompras(plato, personasPlato)}
      />
    )
  }

  if (pantalla === 'opinion' && plato) {
    return (
      <Opinion plato={plato} onVolver={() => volver('detalle')} onEnviar={registrarOpinion} />
    )
  }

  if (pantalla === 'admin' && puedeAdministrar(usuario)) {
    return (
      <AdminPanel onSalir={() => volver('home', 'perfil')} onRegistroPrecios={() => navegar('registro-precios', 'perfil')}
        onLimpiarPrecios={limpiarPrecios} cantidadPrecios={preciosRegistrados.length} opiniones={opiniones} />
    )
  }

  if (pantalla === 'registro-precios' && puedeAdministrar(usuario)) {
    return (
      <RegistroPrecios
        entradasRegistradas={preciosRegistrados}
        onRegistrarPrecio={async (entrada) => {
          setPreciosRegistrados((actuales) => [entrada, ...actuales])
          try {
            const mercadoId = entrada.mercado?.includes('Surquillo') ? 2 : 1
            await BackendService.registrarPrecioMercado(entrada.ingrediente || entrada.producto, entrada.precio, mercadoId)
          } catch (err) {}
        }}
        onActualizarPresentacion={(i, pres) => setPreciosRegistrados((acts) => acts.map((ent, idx) => idx === i ? { ...ent, ...pres } : ent))}
        onVolver={() => volver('admin', 'perfil')}
      />
    )
  }

  if (tab === 'perfil') {
    return (
      <Perfil
        usuario={usuario} guardados={guardados} platosDisponibles={recetasApi.length || PLATOS.length} perfilSalud={perfilSalud}
        onGuardarSalud={guardarSalud} presupuestoBase={presupuestoBase} onGuardarPresupuesto={guardarPresupuestoBase}
        onCompras={() => navegar('compras', 'perfil')} onAhorro={() => navegar('ahorro', 'perfil')}
        onRecordatorios={() => navegar('recordatorios', 'perfil')} onActualizarUsuario={actualizarUsuario}
        onNavegar={irATab} onAdmin={() => navegar('admin', 'perfil')} onLogout={cerrarSesion}/>
    );
  }

  if (tab === 'buscar') {
    return (
      <Buscador
        usuario={usuario}
        platos={recetasApi}
        perfilSalud={perfilSalud}
        preciosRegistrados={preciosRegistrados}
        calificacionesMercados={calificacionesMercados}
        estadisticasMercados={estadisticasMercados}
        onCalificarMercado={calificarMercado}
        guardados={guardados}
        onToggleGuardado={handleToggleGuardado}
        onNavegar={irATab}
        onVerPlato={verPlato}
        busqueda={busqueda}
        presupuestoBase={presupuestoBase}
        opiniones={opiniones}
        onActualizarBusqueda={setBusqueda}
      />
    )
  }

  if (tab === 'mercados') {
  return (
    <Mercados
      mercados={mercadosApi}
      preciosRegistrados={preciosRegistrados}
      calificacionesMercados={calificacionesMercados}
      estadisticasMercados={estadisticasMercados}
      onCalificarMercado={calificarMercado}
      platosReales={recetasApi}
      onNavegar={irATab}
    />
  )
  }

  return (
  <Home
    usuario={usuario}
    recetas={recetasApi}
    mercados={mercadosApi}
    perfilSalud={perfilSalud}
    tab={tab}
    onTab={irATab}
    guardados={guardados}
    onToggleGuardado={handleToggleGuardado}
    onVerPlato={verPlato}
    presupuestoBase={presupuestoBase}
    onCompras={() => navegar('compras', 'perfil')}
  />
  ) 
}
export default App