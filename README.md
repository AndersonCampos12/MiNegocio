# Mi Negocio Al Día

Sistema distribuido de Punto de Venta (POS) y gestión de inventario para emprendedores. Soporta múltiples socios operando sobre un mismo inventario en tiempo real, garantizando consistencia de datos bajo alta concurrencia.

---

## Tabla de Contenidos

- [Arquitectura y Conceptos Teóricos](#arquitectura-y-conceptos-teóricos)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Monorepo](#estructura-del-monorepo)
- [Instalación Local](#instalación-local)
- [Uso con Docker](#uso-con-docker)
- [Características Principales](#características-principales)

---

## Arquitectura y Conceptos Teóricos

El proyecto aterriza teoría de sistemas distribuidos en una aplicación funcional, cubriendo los siguientes principios:

**Consistencia Transaccional (ACID)**
Se utiliza `prisma.$transaction()` en PostgreSQL para aplicar bloqueos de fila. Si dos socios intentan vender el último artículo simultáneamente, solo una transacción es exitosa, evitando inventarios negativos.

**Teorema CAP**
La aplicación prioriza Consistencia (C) y Tolerancia a Particiones (P). Todos los clientes ven el stock exacto vía WebSockets y bloqueos de DB. Una petición puede ser rechazada en colisión extrema antes de guardar un dato corrupto.

**Observabilidad**
Sistema de registro de eventos centralizado en el backend (`logger.service.ts`) para auditoría y depuración, con archivos persistidos en la carpeta `logs/`.

**Principios SOLID**
Código de bajo acoplamiento: rutas separadas de la lógica de negocio (`services`) y validaciones centralizadas en `middlewares`.

---

## Stack Tecnológico

**Frontend**
- Angular 17+ con TypeScript
- Tailwind CSS
- Socket.io-client
- Google Identity Services

**Backend**
- Node.js + Express.js
- Prisma ORM + PostgreSQL
- Socket.io
- JWT + Google Auth Library
- Winston (Logs)
- Docker + Docker Compose

---

## Estructura del Monorepo

```
MiNegocio/
├── backend/
│   ├── docker-compose.yml
│   ├── prisma/                  # Esquemas y migraciones
│   ├── logs/                    # Archivos de observabilidad
│   └── src/
│       ├── config/              # Configuración de DB y Multer
│       ├── errors/              # Clases de manejo de excepciones
│       ├── middlewares/         # Verificación JWT (auth.middleware.ts)
│       ├── routes/              # Endpoints REST: auth, productos, ventas, reportes
│       ├── services/            # Lógica central: ACID, OAuth, Logs
│       └── index.ts             # Entry point + Socket.io
│
└── frontend/
    └── src/app/
        ├── components/          # Caja, Inventario, Login, Dashboard
        ├── guards/              # Protección de rutas
        ├── services/            # Consumo de API y WebSockets
        └── environments/        # Variables públicas (Google Client ID)
```

---

## Instalación Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/AndersonCampos12/MiNegocio
cd MiNegocio
```

### 2. Backend

```bash
cd backend
npm install
```

Crea el archivo `.env` en la raíz de `backend/`:

```env
PORT=3000
DATABASE_URL="postgresql://usuario:password@localhost:5432/minegocio?schema=public"
JWT_SECRET="tu_clave_secreta"
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
FRONTEND_URL="http://localhost:4200"
```

Aplica las migraciones e inicia el servidor:

```bash
npx prisma migrate dev --name init
npx nodemon src/index.ts
```

### 3. Frontend

En una nueva terminal desde la raíz del proyecto:

```bash
cd frontend
npm install
```

Configura `frontend/src/environments/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  googleClientId: 'tu-client-id.apps.googleusercontent.com',
  apiUrl: 'http://localhost:3000/api'
};
```

```bash
ng serve
```

---

## Uso con Docker

Si prefieres no instalar PostgreSQL manualmente, el proyecto incluye configuración de Docker Compose.

### 1. Levantar los contenedores

Desde la carpeta `backend/` donde está el `docker-compose.yml`:

```bash
docker-compose up -d
```

Esto levanta el contenedor de PostgreSQL en segundo plano.

### 2. Aplicar el esquema de Prisma

```bash
npx prisma migrate dev --name init
```

### 3. Iniciar el servidor

```bash
npm run dev
```

Para detener y destruir los contenedores:

```bash
docker-compose down
```

---

## Características Principales

**Autenticación por tokens**
- OAuth 2.0 con Google para inicio de sesión y auto-registro de negocios.
- JWT propio para mantener sesiones stateless en las peticiones REST.

**Tiempo real**
Las actualizaciones de stock viajan por WebSockets a todos los dispositivos conectados bajo el mismo `negocioId`.

**Borrado lógico**
La eliminación de productos no borra el registro físicamente. Activa el flag `activo: false` para mantener la integridad de reportes históricos.

**Manejo de excepciones**
Respuestas estandarizadas desde la capa de servicios. El cliente nunca recibe trazas internas del servidor.