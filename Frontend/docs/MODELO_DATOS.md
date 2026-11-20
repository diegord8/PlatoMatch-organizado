# PlatoMatch — modelo de datos y contrato de API (propuesta)

Documento para cuando se conecte el backend. Está derivado de lo que hoy guarda la app en `localStorage`.
Ajusta nombres y tipos al motor que elijas (el SQL es PostgreSQL).

## 1. Dónde se conecta

Toda la persistencia pasa por `src/services/repositorio.js`. Al conectar:

1. Implementa cada función con `solicitar()` de `src/services/api.js` (usa `VITE_API_URL`).
2. Las funciones pasan a ser `async`: hay que agregar estados de carga y error en `App.jsx`.
3. Reemplaza `src/InicioSesion/cuentas.js` por llamadas a `/auth/*` (el hash y la sesión pasan al servidor).
4. Quita `almacenCalificaciones` / `suscribirCalificaciones`: el promedio de mercados lo calcula el servidor.
5. El rol (`usuario`, `analista`, `admin`) debe validarse en cada endpoint `/admin/*`. Hoy solo se oculta la pantalla.

## 2. Tablas

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,            -- guardar en minúsculas
  password_hash TEXT NOT NULL,           -- bcrypt/argon2 en el servidor
  rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario','analista','admin')),
  presupuesto_base NUMERIC(10,2),        -- HU-19
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuario_alergias   (usuario_id UUID REFERENCES usuarios ON DELETE CASCADE, alergia TEXT, PRIMARY KEY (usuario_id, alergia));
CREATE TABLE usuario_condiciones(usuario_id UUID REFERENCES usuarios ON DELETE CASCADE, condicion TEXT, PRIMARY KEY (usuario_id, condicion));

CREATE TABLE platos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  detalle TEXT,
  precio_referencial NUMERIC(10,2) NOT NULL,   -- por porción
  kcal INT, porciones INT NOT NULL DEFAULT 1, minutos INT,
  imagen_url TEXT
);
CREATE TABLE plato_etiquetas (plato_id INT REFERENCES platos ON DELETE CASCADE, etiqueta TEXT, PRIMARY KEY (plato_id, etiqueta));

CREATE TABLE ingredientes (id SERIAL PRIMARY KEY, nombre TEXT NOT NULL UNIQUE);
CREATE TABLE plato_ingredientes (
  plato_id INT REFERENCES platos ON DELETE CASCADE,
  ingrediente_id INT REFERENCES ingredientes,
  cantidad NUMERIC(10,3) NOT NULL,       -- hoy es texto ('100g', '½ unidad'): separar número y unidad
  unidad TEXT NOT NULL CHECK (unidad IN ('kg','g','l','ml','taza','unidad','diente')),
  aproximada BOOLEAN NOT NULL DEFAULT false,
  destacado TEXT,
  PRIMARY KEY (plato_id, ingrediente_id)
);

CREATE TABLE mercados (id SERIAL PRIMARY KEY, nombre TEXT NOT NULL UNIQUE);   -- hoy lista fija en precios.js

CREATE TABLE precios (                                   -- HU-09 / HU-10
  id BIGSERIAL PRIMARY KEY,
  ingrediente_id INT REFERENCES ingredientes,
  mercado_id INT REFERENCES mercados,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  cantidad_presentacion NUMERIC(10,3) NOT NULL DEFAULT 1 CHECK (cantidad_presentacion > 0),
  unidad_presentacion TEXT NOT NULL,
  fecha DATE NOT NULL,
  registrado_por UUID REFERENCES usuarios
);

CREATE TABLE opiniones (                                 -- HU-13 / HU-14
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios,
  plato_id INT REFERENCES platos,
  calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  destacados TEXT[] NOT NULL DEFAULT '{}',
  comentario TEXT NOT NULL DEFAULT '',
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE calificaciones_mercado (                    -- HU-11
  usuario_id UUID REFERENCES usuarios ON DELETE CASCADE,
  mercado_id INT REFERENCES mercados,
  calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  PRIMARY KEY (usuario_id, mercado_id)
);

CREATE TABLE favoritos (usuario_id UUID REFERENCES usuarios ON DELETE CASCADE, plato_id INT REFERENCES platos, PRIMARY KEY (usuario_id, plato_id));  -- HU-08

CREATE TABLE listas_compra (                             -- HU-15 / HU-16 / HU-17
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios ON DELETE CASCADE,
  plato_id INT REFERENCES platos,
  personas INT NOT NULL CHECK (personas > 0),
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE lista_compra_items (
  lista_id UUID REFERENCES listas_compra ON DELETE CASCADE,
  nombre TEXT, cantidad TEXT,
  en_casa BOOLEAN NOT NULL DEFAULT false,
  comprado BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (lista_id, nombre)
);

CREATE TABLE historial_ahorro (                          -- HU-18 (ahorro potencial)
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios ON DELETE CASCADE,
  plato_id INT REFERENCES platos,
  mercado_elegido TEXT, costo_elegido NUMERIC(10,2), referencia NUMERIC(10,2),
  ahorro NUMERIC(10,2) NOT NULL, mercados_comparados INT, fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recordatorios (                             -- HU-20
  usuario_id UUID PRIMARY KEY REFERENCES usuarios ON DELETE CASCADE,
  activo BOOLEAN NOT NULL DEFAULT false,
  hora TIME NOT NULL DEFAULT '12:00'
);
```

## 3. Endpoints sugeridos

| Función del repositorio | Endpoint | Historia |
|---|---|---|
| (cuentas.js) registrar / login / logout | `POST /auth/registro`, `POST /auth/login`, `POST /auth/logout` | HU-01 |
| (cuentas.js) actualizar cuenta y salud | `GET/PATCH /me` (nombre, email, contraseña, alergias, condiciones, presupuesto_base) | HU-04, HU-19 |
| `cargarPlatos` (hoy `data/platos.js`) | `GET /platos?presupuesto=&personas=&disponibles=` | HU-02 a HU-07 |
| `cargarGuardados` / `guardarGuardados` | `GET /me/favoritos`, `PUT/DELETE /me/favoritos/:platoId` | HU-08 |
| `cargarPreciosRegistrados` / `guardarPreciosRegistrados` | `GET /precios`, `POST /precios`, `PATCH /precios/:id` (analista/admin), `POST /admin/precios/limpiar` | HU-09, HU-10 |
| `cargarCalificacionesMercados` / estadísticas | `GET /mercados` (incluye promedio y total), `PUT /me/mercados/:id/calificacion` | HU-11 |
| (costoReceta.js) | `GET /platos/:id/comparacion-mercados?personas=` | HU-12 |
| `cargarOpiniones` / `guardarOpiniones` | `POST /platos/:id/opiniones`; admin: `GET /admin/opiniones`, `GET /admin/feedback/resumen` | HU-13, HU-14 |
| `cargarDatosPorUsuario` (lista, ahorro, recordatorios, presupuesto) | `GET/PUT /me/lista-compras`, `GET/POST /me/ahorro`, `GET/PUT /me/recordatorios` | HU-15 a HU-20 |
| `cargarUbicacion` | queda en el navegador (estado de navegación, no es dato de negocio) | — |

## 4. Lo que debe pasar al servidor

- **Filtro de alergias y condiciones** (`salud/filtros.js`): que lea un catálogo validado de alérgenos, no listas fijas.
- **Ranking de recomendaciones** y **costo por mercado**: calcularlos cerca de los datos para no enviar todos los precios al cliente.
- **Limpieza de precios** (`Perfil/precios.js`): ejecutarla al insertar, con restricciones en la BD.
- **Recordatorios con la app cerrada**: requieren Web Push y un job programado.
