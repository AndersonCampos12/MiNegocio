# Mi Negocio Al Día
Sistema distribuido de Punto de Venta (POS), gestión de inventario y marketplace público para emprendedores. Soporta múltiples socios operando sobre un mismo inventario en tiempo real, garantizando consistencia de datos bajo alta concurrencia.

---

## Tabla de Contenidos
- [Arquitectura y Conceptos Teóricos](#arquitectura-y-conceptos-teóricos)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Monorepo](#estructura-del-monorepo)
- [Módulos del Sistema](#módulos-del-sistema)
- [Instalación Local](#instalación-local)
- [Uso con Docker](#uso-con-docker)
- [Características Principales](#características-principales)
- [Seguridad y Control de Datos](#seguridad-y-control-de-datos)

---

## Arquitectura y Conceptos Teóricos

El proyecto aterriza teoría de sistemas distribuidos en una aplicación funcional, cubriendo los siguientes principios:

**Consistencia Transaccional (ACID)**
Se utiliza `prisma.$transaction()` en PostgreSQL para aplicar bloqueos de fila. Si dos socios intentan vender el último artículo simultáneamente, solo una transacción es exitosa, evitando inventarios negativos.

**Teorema CAP**
La aplicación prioriza Consistencia (C) y Tolerancia a Particiones (P). Todos los clientes ven el stock exacto vía WebSockets y bloqueos de DB. Una petición puede ser rechazada en colisión extrema antes de guardar un dato corrupto.

**Multi-tenancy**
El sistema está dividido en roles jerárquicos (SUPERADMIN, ADMINISTRADOR, VENDEDOR, CAJERO y CLIENTE) para auditar transacciones y segmentar recursos de forma aislada según la empresa a la que pertenezca cada usuario. Cada usuario es asignado automáticamente a una sala virtual exclusiva de WebSockets correspondiente al identificador de su empresa, blindando las tramas de datos entre comercios.

**Observabilidad**
Sistema de registro de eventos centralizado en el backend (`logger.service.ts`) para auditoría y depuración, con archivos persistidos en la carpeta `logs/`.

**Principios SOLID**
Código de bajo acoplamiento: rutas separadas de la lógica de negocio (`services`) y validaciones centralizadas en `middlewares`.

---

## Stack Tecnológico

**Frontend**
- Angular 17+ con TypeScript (Componentes Standalone)
- Tailwind CSS
- RxJS (observables, switchMap, debounceTime)
- Socket.io-client
- Google Identity Services

**Backend**
- Node.js + Express.js con TypeScript
- Prisma ORM + PostgreSQL (con pool de conexiones nativo via pg)
- Socket.io
- JWT + Google Auth Library
- Winston (Logs)
- Multer (carga de archivos)
- Docker + Docker Compose

---

## Estructura del Monorepo

MiNegocio/
├── backend/
│   ├── docker-compose.yml
│   ├── prisma/                  # Esquemas y migraciones
│   ├── logs/                    # Archivos de observabilidad
│   └── src/
│       ├── config/              # Configuración de DB y Multer
│       ├── errors/              # Clases de manejo de excepciones
│       ├── middlewares/         # Verificación JWT (auth.middleware.ts)
│       ├── routes/              # Endpoints REST: auth, productos, ventas, reportes, tienda
│       ├── services/            # Lógica central: ACID, OAuth, Logs, Tienda
│       └── index.ts             # Entry point + Socket.io
│
└── frontend/
    └── src/app/
        ├── components/          # Caja, Inventario, Login, Dashboard, Tienda
        ├── guards/              # Protección de rutas
        ├── services/            # Consumo de API, WebSockets y Carrito
        └── environments/        # Variables públicas (Google Client ID)

---

## Módulos del Sistema

### Autenticación y Control de Acceso
Estructura de inicio de sesión y registro basada en tokens JWT. Middlewares en cascada para la verificación de tokens y restricciones estrictas por roles (`verificarToken`, `verificarRol`). Un middleware global intercepta las conexiones de WebSockets, valida el JWT provisto en el handshake y asocia los datos de sesión directamente a la memoria del socket.

### Caja / Punto de Venta (POS)
Terminal operativa de ventas optimizada para cajeros y vendedores. Manejo de estados mediante un carrito de compras reactivo estructurado sobre colecciones Map nativas. Cálculo automático de IVA (15%) integrado dinámicamente. Buscador asíncrono y predictivo de clientes con debounceTime. Métodos de pago soportados: Efectivo, PAYPHONE y KUSHKI.

### Facturación e Impresión Automatizada
El proceso de venta ejecuta un bloque transaccional aislado que descuenta el stock, confirma montos y genera un registro único de facturación asociado a un UUID. Al finalizar, el frontend renderiza en un modal un iframe con un ticket térmico HTML que se autoimprime mediante `window.print(); window.close();`.

### Gestión de Inventarios y Catálogo de Productos
Módulo CRUD de productos con desactivación lógica (flag `activo: false`). Carga de imágenes gestionada mediante multer. El stock visible se actualiza en tiempo real vía WebSockets cuando otro terminal genera una venta.

### Tienda / Marketplace Público
Vitrina pública con los productos de todos los negocios activos. Filtrado dinámico por slug de negocio. Carrito persistido en localStorage. Panel lateral con animación slide-in, badge contador en el header y cálculo de total en tiempo real. Cuando un administrador agrega un producto, aparece en el grid con un badge "NUEVO" durante 10 segundos gracias al evento WebSocket `nuevo_producto`.

Endpoints públicos de la tienda:
- GET /api/tienda/productos?negocio=slug  —  Productos activos de negocios activos
- GET /api/tienda/negocios               —  Lista de negocios activos

Carrito (localStorage):
- Clave: carrito_tienda
- Operaciones: agregar, eliminar, actualizar cantidad, calcular total, vaciar

### Reportes y Analítica
Métricas consolidadas con agregaciones nativas de la base de datos (_sum, _count). Indicadores de ingresos totales, volumen de tickets, alertas de stock crítico (menos de 10 unidades). Gráfico de tendencias temporales con alturas porcentuales dinámicas. Historial de ventas auditado con vendedor, método de pago y acceso al ticket histórico. Top de productos más vendidos.

---

## Instalación Local

### 1. Clonar el repositorio

git clone https://github.com/tu-usuario/MiNegocio
cd MiNegocio

### 2. Backend

cd backend
npm install

Crea el archivo .env en la raíz de backend/:

PORT=3000
DATABASE_URL="postgresql://usuario:password@localhost:5432/minegocio?schema=public"
JWT_SECRET="tu_clave_secreta"
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
FRONTEND_URL="http://localhost:4200"

Aplica las migraciones e inicia el servidor:

npx prisma migrate dev --name init
npx nodemon src/index.ts

### 3. Frontend

En una nueva terminal desde la raíz del proyecto:

cd frontend
npm install

Configura frontend/src/environments/environment.development.ts:

export const environment = {
  production: false,
  googleClientId: 'tu-client-id.apps.googleusercontent.com',
  apiUrl: 'http://localhost:3000/api'
};

ng serve

---

## Uso con Docker

Si prefieres no instalar PostgreSQL manualmente, el proyecto incluye configuración de Docker Compose.

### 1. Levantar los contenedores

Desde la carpeta backend/ donde está el docker-compose.yml:

docker-compose up -d

Esto levanta el contenedor de PostgreSQL en segundo plano.

### 2. Aplicar el esquema de Prisma

npx prisma migrate dev --name init

### 3. Iniciar el servidor

npm run dev

Para detener y destruir los contenedores:

docker-compose down

---

## Características Principales

**Autenticación por tokens**
OAuth 2.0 con Google para inicio de sesión y auto-registro de negocios. JWT propio para mantener sesiones stateless en las peticiones REST.

**Tiempo real**
Las actualizaciones de stock y los nuevos productos viajan por WebSockets a todos los dispositivos conectados bajo el mismo negocioId.

**Borrado lógico**
La eliminación de productos activa el flag `activo: false` para mantener la integridad de reportes históricos sin borrar registros físicamente.

**Manejo de excepciones**
Respuestas estandarizadas desde la capa de servicios. El cliente nunca recibe trazas internas del servidor. Interceptores de Angular homogenizan los errores HTTP en mensajes legibles.

**Notificaciones reactivas (Toasts)**
ToastService inyectable globalmente con un componente ToastContainer fijado con alta prioridad visual. Procesa flujos reactivos del usuario y eventos de Socket.io envueltos en NgZone para consistencia visual instantánea.

---

## Seguridad y Control de Datos

**Protección de Archivos Estáticos (Signed URLs)**
Se eliminó el acceso público directo a /uploads. El backend firma las URLs de imágenes con un JWT interno de corta duración (1 hora) vinculado al nombre del archivo, transformando las rutas en endpoints protegidos (/api/productos/ver-imagen/...). Si el token expira o es manipulado, el servidor responde con 403 Forbidden.

**Prevención de Path Traversal**
El endpoint de despacho de imágenes sanitiza de forma absoluta las rutas del sistema de archivos, comprobando mediante resolución de paths que ningún parámetro malicioso intente escalar directorios fuera de la carpeta confinada de almacenamiento.

**Aislamiento de WebSockets por negocio**
Al conectarse, cada usuario es asignado automáticamente a una sala exclusiva (socket.join(negocioId)), blindando las tramas de datos entre comercios distintos.

**Roles jerárquicos**
SUPERADMIN, ADMINISTRADOR, VENDEDOR, CAJERO y CLIENTE. Cada endpoint valida el rol mínimo requerido antes de ejecutar cualquier lógica de negocio.