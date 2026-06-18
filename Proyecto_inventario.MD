# Sistema de Inventario y Logística — Plan de Desarrollo

> Documento de fases de desarrollo del sistema de control de inventario multi-almacén.
> Basado en la propuesta inicial `Inventario_logistica_09-07-2025.docx` con mejoras de arquitectura, UX/UI y seguridad.

---

## Stack Tecnológico Recomendado

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Backend** | Node.js + Express.js | Desarrollo ágil, gran ecosistema, ideal para REST APIs |
| **Frontend** | React.js + Vite | Componentes reutilizables, renderizado eficiente |
| **UI Framework** | Ant Design (AntD) | Componentes de tablas, formularios y reportes listos |
| **Base de datos** | MySQL 8 | Relacional, óptima para inventarios y auditorías |
| **ORM** | Prisma | Type-safe, migraciones automáticas, fácil mantenimiento |
| **Autenticación** | JWT + bcrypt | Estándar seguro, sin estado en servidor |
| **Reportes** | ExcelJS + jsPDF | Generación de reportes Excel y PDF desde Node |
| **Proceso Node** | PM2 | Gestor de procesos para Node.js en producción, auto-restart y logs |
| **Servidor web** | Nginx | Proxy inverso, compresión gzip, caché de estáticos |
| **Hosting** | Hostinger VPS (Ubuntu) | Root access, Node.js nativo, MySQL y Nginx sin restricciones |

---

## Arquitectura General

```
┌─────────────────────────────────────────────┐
│                  CLIENTE                     │
│         React.js + Ant Design                │
└──────────────────┬──────────────────────────┘
                   │ HTTPS / REST API
┌──────────────────▼──────────────────────────┐
│               API Gateway                    │
│         Node.js + Express.js                 │
│   [Auth Middleware] [Rate Limiter] [Logs]    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              Base de Datos                   │
│         MySQL 8 via Prisma ORM               │
└─────────────────────────────────────────────┘
```

---

## Módulos del Sistema

### Módulos Principales
1. **Autenticación y Usuarios** — Login, roles y permisos
2. **Almacenes** — Gestión de múltiples almacenes
3. **Catálogo de Materiales** — Materiales por categoría
4. **Entradas** — Registro de ingresos con folio automático
5. **Salidas** — Modelo de préstamo (material puede reingresar)
6. **Transferencias** — Movimientos entre almacenes
7. **Pérdidas** — Registro de mermas y extravíos
8. **Reportes** — Reportes por almacén, periodo y tipo de movimiento
9. **Auditoría** — Bitácora de acciones del sistema

---

## Fases de Desarrollo

---

### FASE 0 — Análisis y Arquitectura
**Duración estimada: 1 semana**

#### Objetivos
- Definir y validar todos los requerimientos funcionales y no funcionales
- Diseñar el esquema de base de datos completo
- Definir los contratos de API (endpoints, payloads, respuestas)
- Crear wireframes de las pantallas principales

#### Entregables
- [ ] Documento de requerimientos validado
- [ ] Diagrama Entidad-Relación (ERD) de la base de datos
- [ ] Listado de endpoints REST con ejemplos de request/response
- [ ] Wireframes en Figma o similar (mockups de baja fidelidad)
- [ ] Definición de roles de usuario: `Admin`, `Almacenista`, `Supervisor`, `Solo lectura`

#### Esquema de Base de Datos (diseño inicial)

```sql
-- Usuarios y roles
users (id, name, email, password_hash, role, almacen_id, active, created_at)
roles (id, name, permissions_json)

-- Almacenes y catálogo
almacenes (id, nombre, proyecto, responsable_id, activo)
categorias (id, nombre, descripcion)
materiales (id, nombre, categoria_id, unidad_medida, descripcion, activo)
stock (id, almacen_id, material_id, cantidad_actual, updated_at)

-- Movimientos
entradas (id, folio, almacen_id, proveedor, autorizo_id, comentario, fecha, created_by)
entradas_detalle (id, entrada_id, material_id, cantidad)

salidas (id, folio, almacen_id, tramo, solicito, recibio, entrego, comentario, fecha, retornable, created_by)
salidas_detalle (id, salida_id, material_id, cantidad_solicitada, cantidad_retornada)

transferencias (id, folio, almacen_origen_id, almacen_destino_id, solicito, recibio, entrego, estado, comentario, fecha)
transferencias_detalle (id, transferencia_id, material_id, cantidad)

perdidas (id, folio, almacen_id, motivo, autorizo_id, comentario, fecha)
perdidas_detalle (id, perdida_id, material_id, cantidad)

-- Auditoría
auditoria (id, user_id, accion, tabla, registro_id, datos_anteriores, datos_nuevos, ip, fecha)
```

---

### FASE 1 — Fundación del Proyecto
**Duración estimada: 1 semana**

#### Backend
- [ ] Inicializar proyecto Node.js + Express + Prisma
- [ ] Configurar variables de entorno (`.env`) con validación
- [ ] Conectar y migrar base de datos MySQL
- [ ] Configurar middleware global: CORS, Helmet, Morgan (logs), Rate Limiting
- [ ] Estructura de carpetas por módulo (routes / controllers / services / validators)

#### Frontend
- [ ] Inicializar proyecto React + Vite + TypeScript
- [ ] Integrar Ant Design como UI framework
- [ ] Configurar React Router para navegación
- [ ] Configurar Axios con interceptores de token
- [ ] Estructura de carpetas: pages / components / hooks / services / store

#### Entorno Local de Desarrollo
- [ ] Repositorio Git con `main`, `develop` y ramas por feature
- [ ] Instalar Node.js vía NVM en cada máquina de desarrollo (`nvm use 20`)
- [ ] MySQL local: XAMPP (Windows) o MySQL Workbench para gestión visual
- [ ] Archivo `.env.development` con credenciales locales (excluido del repositorio)
- [ ] Archivo `.env.production` con plantilla vacía documentada en el repo
- [ ] Variables de entorno separadas por ambiente: `development`, `production`
- [ ] Script `npm run dev` para levantar backend con nodemon (hot reload)
- [ ] Script `npm run db:migrate` para aplicar migraciones Prisma en local

---

### FASE 2 — MVP (Producto Mínimo Viable)
**Duración estimada: 3 semanas**

El MVP permite operar el ciclo completo de un almacén: ingresar materiales, registrar salidas y consultar stock.

#### 2.1 Autenticación y Usuarios
- [ ] `POST /api/auth/login` — Login con JWT (access token + refresh token)
- [ ] `POST /api/auth/logout` — Invalidar sesión
- [ ] `GET /api/auth/me` — Perfil del usuario logueado
- [ ] Pantalla de login con validación de formulario
- [ ] Guard de rutas privadas en React
- [ ] Almacenamiento seguro de token (`httpOnly cookie` o `memory + refresh`)

#### 2.2 Gestión de Almacenes
- [ ] CRUD completo de almacenes
- [ ] Asignación de responsable por almacén
- [ ] Vista de lista de almacenes con estado y proyecto asignado
- [ ] Vista de detalle de almacén con stock actual

#### 2.3 Catálogo de Materiales
- [ ] CRUD de categorías
- [ ] CRUD de materiales (nombre, categoría, unidad de medida)
- [ ] Búsqueda y filtrado de materiales
- [ ] Vista de tabla con paginación

#### 2.4 Entradas
- [ ] `POST /api/entradas` — Crear entrada con folio automático `ALMACEN-PROY-0001`
- [ ] `GET /api/entradas` — Listar con filtros (almacén, fecha, proveedor)
- [ ] `GET /api/entradas/:id` — Detalle de entrada
- [ ] Formulario multi-paso: datos generales → agregar materiales → confirmar
- [ ] Actualización automática de stock al confirmar entrada

#### 2.5 Salidas (Modelo Préstamo)
- [ ] `POST /api/salidas` — Crear salida con folio automático
- [ ] Campo `retornable: boolean` para identificar préstamos
- [ ] `PATCH /api/salidas/:id/retornar` — Registrar retorno parcial o total
- [ ] Formulario con campos: Tramo, Solicitó, Recibió, Entregó
- [ ] Validación de stock disponible antes de confirmar salida
- [ ] Indicador visual de salidas pendientes de retorno

#### 2.6 Dashboard Principal
- [ ] Cards con totales: almacenes activos, entradas del día, salidas pendientes
- [ ] Tabla de últimos movimientos (entradas + salidas)
- [ ] Gráfica de stock por almacén (barras horizontales)

---

### FASE 3 — Módulos Extendidos
**Duración estimada: 2 semanas**

#### 3.1 Transferencias entre Almacenes
- [ ] Folio automático combinado: `ALM1-ALM2-0001`
- [ ] Estados del flujo: `Pendiente → Enviado → Recibido`
- [ ] Al confirmar "Recibido" se actualiza stock en ambos almacenes
- [ ] Notificación en pantalla al almacén destino cuando hay transferencia pendiente
- [ ] Historial de transferencias con filtros

#### 3.2 Registro de Pérdidas
- [ ] Folio automático por almacén
- [ ] Campos: motivo, autoriza, materiales afectados, comentario
- [ ] Impacto en stock registrado automáticamente
- [ ] Vista de reporte de pérdidas por periodo

#### 3.3 Gestión de Usuarios y Roles
- [ ] CRUD de usuarios (solo Admin)
- [ ] Roles definidos con permisos específicos:

| Rol | Entradas | Salidas | Transferencias | Pérdidas | Reportes | Usuarios |
|-----|----------|---------|----------------|----------|----------|----------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Almacenista | ✅ | ✅ | ✅ | ✅ | Ver | ❌ |
| Supervisor | Ver | Ver | Ver | Ver | ✅ | ❌ |
| Solo lectura | Ver | Ver | Ver | Ver | Ver | ❌ |

- [ ] Middleware de autorización por rol en cada endpoint

#### 3.4 Módulo de Reportes
- [ ] Reporte de stock actual por almacén → exportar a Excel
- [ ] Reporte de stock en periodo de tiempo → exportar a Excel
- [ ] Reporte general de todos los almacenes → exportar a PDF
- [ ] Reporte de movimientos (entradas/salidas/transferencias) por rango de fechas
- [ ] Vista previa en pantalla antes de exportar
- [ ] Filtros: almacén, fecha desde/hasta, tipo de movimiento, material

---

### FASE 4 — UX/UI y Experiencia de Usuario
**Duración estimada: 1.5 semanas**

#### Diseño y Sistema Visual
- [ ] Definir paleta de colores, tipografía y espaciado (Design Tokens)
- [ ] Tema personalizado sobre Ant Design (colores de marca)
- [ ] Modo oscuro / claro con preferencia guardada
- [ ] Iconografía consistente (AntD Icons o Phosphor Icons)

#### Componentes Reutilizables
- [ ] `<DataTable>` — Tabla con paginación, filtros, exportación integrada
- [ ] `<StatusBadge>` — Indicadores de estado con colores semánticos
- [ ] `<FolioTag>` — Etiqueta visual de folio para movimientos
- [ ] `<StockAlert>` — Alerta cuando el stock está por debajo del mínimo
- [ ] `<MovimientoTimeline>` — Línea de tiempo de movimientos de un material

#### Experiencia de Formularios
- [ ] Validación en tiempo real con mensajes claros en español
- [ ] Autocompletado de materiales en formularios de entrada/salida
- [ ] Confirmación modal antes de registrar movimientos irreversibles
- [ ] Indicador de progreso en formularios multi-paso
- [ ] Guardado borrador automático en localStorage para evitar pérdida de datos

#### Responsive Design
- [ ] Layout adaptable: sidebar colapsable en tablet, menú bottom en móvil
- [ ] Tablas con scroll horizontal en pantallas pequeñas
- [ ] Formularios en una columna en móvil, dos columnas en desktop

#### Accesibilidad
- [ ] Contraste de colores WCAG AA mínimo
- [ ] Navegación completa por teclado
- [ ] Etiquetas `aria-label` en todos los controles de formulario

---

### FASE 5 — Seguridad
**Duración estimada: 1 semana**

#### Autenticación y Sesiones
- [ ] Tokens JWT con expiración corta (15 min) + Refresh Token (7 días)
- [ ] Refresh Token rotativo: cada uso genera uno nuevo e invalida el anterior
- [ ] Bloqueo de cuenta tras 5 intentos fallidos de login
- [ ] Sesiones activas visibles y opción de cerrar sesión remota

#### Protección de la API
- [ ] Helmet.js para cabeceras HTTP seguras
- [ ] Rate limiting: 100 req/min por IP general, 10 req/min en `/auth/login`
- [ ] Validación de inputs con `Zod` en todos los endpoints (evita injection)
- [ ] Sanitización de datos antes de insertar en base de datos
- [ ] CORS configurado solo para dominios autorizados

#### Base de Datos
- [ ] Queries parametrizadas a través de Prisma (prevención SQL Injection)
- [ ] Usuario de BD con permisos mínimos (sin DROP, sin CREATE)
- [ ] Backups automáticos diarios con retención de 30 días
- [ ] Datos sensibles (passwords) con hash bcrypt costo 12

#### Auditoría
- [ ] Registro en tabla `auditoria` de cada acción: quién, qué, cuándo, desde qué IP
- [ ] Los registros de auditoría son de solo lectura (nadie puede editarlos ni borrarlos)
- [ ] Vista de bitácora filtrable para el rol Admin

#### HTTPS y Despliegue
- [ ] Certificado SSL/TLS obligatorio en producción
- [ ] Variables de entorno en servidor (nunca en código fuente)
- [ ] `.env` incluido en `.gitignore`
- [ ] Escaneo de dependencias vulnerables con `npm audit` en CI/CD

---

### FASE 6 — Pruebas y Calidad
**Duración estimada: 1 semana**

#### Backend
- [ ] Pruebas unitarias de servicios críticos: cálculo de stock, generación de folios
- [ ] Pruebas de integración de endpoints con Supertest
- [ ] Pruebas de regresión en flujo completo: entrada → salida → transferencia
- [ ] Cobertura de código mínima: 70%

#### Frontend
- [ ] Pruebas de componentes con React Testing Library
- [ ] Pruebas E2E del flujo principal con Playwright
  - Login → Ver almacén → Registrar entrada → Registrar salida → Ver reporte

#### Calidad de Código
- [ ] ESLint + Prettier configurados con reglas estrictas
- [ ] Husky + lint-staged para validación pre-commit
- [ ] TypeScript strict mode activo en frontend

---

### FASE 7 — Despliegue y Lanzamiento
**Duración estimada: 1 semana**

#### Infraestructura en Hostinger VPS

> Plan recomendado: **KVM 2** (2 vCPU, 8 GB RAM, Ubuntu 22.04) — suficiente para el sistema completo.

**Configuración inicial del VPS**
- [ ] Acceso SSH con llave pública (deshabilitar login por contraseña)
- [ ] Actualizar sistema: `apt update && apt upgrade`
- [ ] Instalar Node.js 20 LTS vía NVM
- [ ] Instalar MySQL 8: `apt install mysql-server` + `mysql_secure_installation`
- [ ] Instalar Nginx: `apt install nginx`
- [ ] Instalar PM2 globalmente: `npm install -g pm2`
- [ ] Instalar Certbot para SSL: `apt install certbot python3-certbot-nginx`

**Configuración de Nginx como proxy inverso**
```nginx
# /etc/nginx/sites-available/inventario
server {
    listen 80;
    server_name tudominio.com;

    # Frontend (archivos estáticos del build de React)
    location / {
        root /var/www/inventario/frontend/dist;
        try_files $uri /index.html;
        gzip_static on;
    }

    # Backend (API Node.js en puerto 3000)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```
- [ ] Habilitar sitio: `ln -s /etc/nginx/sites-available/inventario /etc/nginx/sites-enabled/`
- [ ] Obtener certificado SSL: `certbot --nginx -d tudominio.com`
- [ ] Renovación automática de SSL (cron de Certbot ya la configura)

**Configuración de PM2**
```js
// ecosystem.config.js (en la raíz del backend)
module.exports = {
  apps: [{
    name: 'inventario-api',
    script: 'src/index.js',
    instances: 2,          // 2 procesos para aprovechar los 2 vCPU
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/inventario-error.log',
    out_file:   '/var/log/pm2/inventario-out.log',
  }]
}
```
- [ ] Iniciar con: `pm2 start ecosystem.config.js --env production`
- [ ] Configurar inicio automático: `pm2 startup` + `pm2 save`

**Base de datos en el VPS**
- [ ] Crear base de datos y usuario MySQL con permisos mínimos
- [ ] Configurar acceso solo desde `localhost` (no exponer puerto 3306 al exterior)
- [ ] Cron de backup diario: `mysqldump` comprimido en `/backups/` con retención 30 días
- [ ] Variables de entorno de producción en `/var/www/inventario/backend/.env` (permisos 600)

**Firewall**
- [ ] Configurar UFW: solo puertos 22 (SSH), 80 (HTTP) y 443 (HTTPS) abiertos
- [ ] Bloquear acceso externo al puerto 3000 (Node solo accesible via Nginx)

#### CI/CD con GitHub Actions (deploy vía SSH a Hostinger)
- [ ] Pipeline con GitHub Actions:
  1. Lint y pruebas automáticas en cada Pull Request
  2. En merge a `main`: build del frontend (`npm run build`)
  3. Deploy al VPS vía SSH: `git pull` + `npm ci` + `npx prisma migrate deploy` + `pm2 reload`
  4. El build de React (`/dist`) se copia a `/var/www/inventario/frontend/dist` vía `rsync`

```yaml
# .github/workflows/deploy.yml (fragmento clave)
- name: Deploy to Hostinger VPS
  uses: appleboy/ssh-action@v1
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ${{ secrets.VPS_USER }}
    key: ${{ secrets.VPS_SSH_KEY }}
    script: |
      cd /var/www/inventario/backend
      git pull origin main
      npm ci --omit=dev
      npx prisma migrate deploy
      pm2 reload inventario-api
```
- [ ] Secretos configurados en GitHub: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

#### Monitoreo
- [ ] Logs estructurados con Winston (nivel info/warn/error)
- [ ] Alertas de errores críticos por correo o webhook
- [ ] Health check endpoint `GET /api/health`

#### Lanzamiento
- [ ] Carga de datos iniciales: usuarios, almacenes y catálogo de materiales
- [ ] Manual de usuario en PDF por rol
- [ ] Capacitación a almacenistas y administradores
- [ ] Periodo de prueba en paralelo con sistema anterior (si aplica): 2 semanas

---

## API REST — Endpoints Principales

```
AUTH
  POST   /api/auth/login
  POST   /api/auth/logout
  POST   /api/auth/refresh
  GET    /api/auth/me

ALMACENES
  GET    /api/almacenes
  POST   /api/almacenes
  GET    /api/almacenes/:id
  PUT    /api/almacenes/:id
  GET    /api/almacenes/:id/stock

MATERIALES
  GET    /api/materiales
  POST   /api/materiales
  GET    /api/materiales/:id
  PUT    /api/materiales/:id

ENTRADAS
  GET    /api/entradas
  POST   /api/entradas
  GET    /api/entradas/:id

SALIDAS
  GET    /api/salidas
  POST   /api/salidas
  GET    /api/salidas/:id
  PATCH  /api/salidas/:id/retornar

TRANSFERENCIAS
  GET    /api/transferencias
  POST   /api/transferencias
  PATCH  /api/transferencias/:id/estado

PERDIDAS
  GET    /api/perdidas
  POST   /api/perdidas

REPORTES
  GET    /api/reportes/stock?almacen=&fecha=
  GET    /api/reportes/movimientos?desde=&hasta=&tipo=
  GET    /api/reportes/general

USUARIOS (Admin)
  GET    /api/usuarios
  POST   /api/usuarios
  PUT    /api/usuarios/:id
  DELETE /api/usuarios/:id

AUDITORIA (Admin)
  GET    /api/auditoria
```

---

## Cronograma Resumen

| Fase | Descripción | Duración |
|------|-------------|----------|
| 0 | Análisis y Arquitectura | 1 semana |
| 1 | Fundación del Proyecto | 1 semana |
| 2 | MVP — Core del Sistema | 3 semanas |
| 3 | Módulos Extendidos | 2 semanas |
| 4 | UX/UI y Experiencia | 1.5 semanas |
| 5 | Seguridad | 1 semana |
| 6 | Pruebas y Calidad | 1 semana |
| 7 | Despliegue y Lanzamiento | 1 semana |
| **Total** | | **~11.5 semanas** |

---

## Mejoras Propuestas sobre la Propuesta Inicial

1. **Modelo de préstamos en Salidas** — Se agrega retorno parcial o total de materiales con trazabilidad completa
2. **Flujo de estados en Transferencias** — `Pendiente → Enviado → Recibido` para evitar inconsistencias de stock
3. **Stock mínimo por material** — Alerta automática cuando el stock baja del umbral definido
4. **Roles granulares** — 4 niveles de acceso en lugar de un solo perfil
5. **Auditoría completa** — Bitácora inmutable de todos los movimientos y acciones del sistema
6. **Reportes exportables** — Excel y PDF generados directamente desde el servidor
7. **Refresh Token rotativo** — Seguridad de sesión mejorada sin afectar la experiencia del usuario
8. **Hostinger VPS con PM2 + Nginx** — Sin Docker, instalación directa sobre Ubuntu 22.04; Nginx sirve el frontend estático y actúa como proxy al API de Node.js; PM2 gestiona el proceso con reinicio automático y clustering

---

*Documento generado: 2026-06-18 | Versión: 1.1 — Adaptado para Hostinger VPS (sin Docker)*
