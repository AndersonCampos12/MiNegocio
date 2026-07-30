# Mi Negocio Al Día

Sistema distribuido de **Punto de Venta (POS), inventario, facturación y comercio electrónico**, diseñado para que varios usuarios puedan trabajar sobre uno o varios negocios utilizando la misma información de manera segura y en tiempo real.

El sistema permite administrar productos, clientes, usuarios, ventas, inventario, negocios y facturación desde un panel administrativo. Además, cuenta con una tienda pública donde los clientes pueden consultar productos y realizar pedidos.

---

#  Tabla de contenidos

* [1. ¿Qué es Mi Negocio Al Día?](#1-qué-es-mi-negocio-al-día)
* [2. ¿Cómo funciona?](#2-cómo-funciona)
* [3. Tecnologías utilizadas](#3-tecnologías-utilizadas)
* [4. Requisitos](#4-requisitos)
* [5. Estructura del proyecto](#5-estructura-del-proyecto)
* [6. Instalación rápida](#6-instalación-rápida)
* [7. Instalación paso a paso](#7-instalación-paso-a-paso)
* [8. Configuración del archivo .env](#8-configuración-del-archivo-env)
* [9. Base de datos PostgreSQL](#9-base-de-datos-postgresql)
* [10. Prisma](#10-prisma)
* [11. Ollama e inteligencia artificial](#11-ollama-e-inteligencia-artificial)
* [12. PocketBase y logos](#12-pocketbase-y-logos)
* [13. Sistema de correos](#13-sistema-de-correos)
* [14. Ejecutar el sistema](#14-ejecutar-el-sistema)
* [15. Cómo utilizar el sistema](#15-cómo-utilizar-el-sistema)
* [16. Roles de usuario](#16-roles-de-usuario)
* [17. Módulos](#17-módulos)
* [18. Arquitectura](#18-arquitectura)
* [19. Seguridad](#19-seguridad)
* [20. Comunicación en tiempo real](#20-comunicación-en-tiempo-real)
* [21. Facturación y envío de PDF](#21-facturación-y-envío-de-pdf)
* [22. Pagos](#22-pagos)
* [23. Comandos útiles](#23-comandos-útiles)
* [24. Actualizar el sistema](#24-actualizar-el-sistema)
* [25. Problemas frecuentes](#25-problemas-frecuentes)
* [26. Comandos peligrosos](#26--comandos-peligrosos)
* [27. Checklist final](#27-checklist-final)

---

# 1. ¿Qué es Mi Negocio Al Día?

**Mi Negocio Al Día** es una aplicación web para administrar negocios.

En términos sencillos, el sistema permite:

* Registrar negocios.
* Registrar usuarios.
* Asignar diferentes permisos.
* Registrar clientes.
* Registrar productos.
* Controlar el inventario.
* Realizar ventas.
* Generar facturas.
* Descargar facturas en PDF.
* Enviar facturas por correo.
* Mostrar productos en una tienda online.
* Permitir que clientes se registren.
* Permitir inicio de sesión mediante Google.
* Realizar pedidos desde el ecommerce.
* Utilizar pagos electrónicos.
* Mostrar recomendaciones de productos utilizando inteligencia artificial.
* Actualizar información en tiempo real mediante WebSockets.

El proyecto está pensado para trabajar con **varios negocios y varios usuarios simultáneamente**.

---

# 2. ¿Cómo funciona?

La aplicación está dividida principalmente en tres partes:

```text
                    MI NEGOCIO AL DÍA
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
         FRONTEND       BACKEND      SERVICIOS
         Angular       Node/Express    externos
              │            │
              │            ├── PostgreSQL
              │            ├── PocketBase
              │            ├── Ollama
              │            ├── Google
              │            ├── Resend
              │            └── PayPal / PayPhone
              │
              └─────── HTTP / WebSocket ───────┘
```

## Frontend

Es la parte que ve el usuario.

Está desarrollado con Angular y contiene:

* Login.
* Registro.
* Dashboard.
* Caja.
* Productos.
* Clientes.
* Usuarios.
* Negocios.
* Reportes.
* Perfil.
* Ecommerce.
* Carrito.
* Facturación.

Normalmente se ejecuta en:

```text
http://localhost:4200
```

---

## Backend

Es el cerebro del sistema.

Está desarrollado con:

* Node.js
* Express
* TypeScript
* Prisma
* Socket.IO

El backend recibe las solicitudes del frontend, valida los permisos, consulta la base de datos y ejecuta las operaciones importantes.

Normalmente funciona en:

```text
http://localhost:3000
```

El navegador **no debe conectarse directamente a PostgreSQL**.

La comunicación correcta es:

```text
Angular
   │
   ▼
Backend
   │
   ▼
PostgreSQL
```

---

## PostgreSQL

Es donde se almacenan los datos principales.

Por ejemplo:

* Usuarios.
* Negocios.
* Clientes.
* Productos.
* Ventas.
* Detalles de ventas.
* Pedidos.
* Información relacionada con el sistema.

PostgreSQL se ejecuta mediante Docker.

---

# 3. Tecnologías utilizadas

## Frontend

* Angular
* TypeScript
* Angular Standalone Components
* Tailwind CSS
* RxJS
* Socket.IO Client
* Google Identity Services

## Backend

* Node.js
* Express
* TypeScript
* Prisma ORM
* PostgreSQL
* Socket.IO
* JWT
* Google Auth Library
* Winston
* Multer
* Puppeteer

## Servicios adicionales

* Docker
* Docker Compose
* PocketBase
* Ollama
* Resend
* Google OAuth
* PayPal
* PayPhone

---

# 4. Requisitos

Antes de instalar el proyecto se necesita tener instalado:

* Git
* Node.js 20 LTS o superior
* npm
* Docker Desktop
* Ollama

Comprobar las versiones:

```bash
git --version
node --version
npm --version
docker --version
ollama --version
```

## Windows

Utilizar:

```text
PowerShell
```

o una terminal compatible.

Docker Desktop debe estar abierto antes de ejecutar los comandos de Docker.

## Linux

Utilizar:

```text
Bash
```

Docker debe estar instalado y funcionando.

---

# 5. Estructura del proyecto

La estructura general es:

```text
MiNegocio/
│
├── backend/
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed/
│   │
│   ├── pocketbase/
│   │   └── Dockerfile
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── errors/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   │
│   ├── logs/
│   ├── docker-compose.yml
│   ├── package.json
│   └── .env
│
└── frontend/
    │
    ├── src/
    │   └── app/
    │       ├── components/
    │       ├── guards/
    │       ├── services/
    │       └── environments/
    │
    ├── package.json
    └── angular.json
```

---

# 6. Instalación rápida

Si es una instalación completamente nueva y el archivo `.env` ya está preparado, el proceso general es:

### 1. Clonar

```bash
git clone URL_DEL_REPOSITORIO
cd MiNegocio
```

### 2. Instalar backend

```bash
cd backend
npm ci
```

### 3. Instalar frontend

En otra terminal:

```bash
cd MiNegocio/frontend
npm ci
```

### 4. Levantar Docker

Desde:

```text
MiNegocio/backend
```

ejecutar:

```bash
docker compose up -d
```

### 5. Preparar PostgreSQL

```bash
npx prisma migrate deploy
npx prisma generate
```

Si es una base de datos completamente nueva y se necesitan los datos de demostración:

```bash
npx prisma db seed
```

### 6. Preparar inteligencia artificial

Desde `backend`:

```bash
npm run ai:setup
```

### 7. Ejecutar backend

```bash
npm run dev
```

### 8. Ejecutar frontend

En otra terminal:

```bash
cd frontend
npm start
```

### 9. Abrir el sistema

```text
http://localhost:4200
```

---

# 7. Instalación paso a paso

Esta sección explica la instalación completa para una persona que nunca ha utilizado el proyecto.

---

## Paso 1. Descargar el proyecto

Si todavía no tienes el proyecto:

```bash
git clone URL_DEL_REPOSITORIO
```

Después:

```bash
cd MiNegocio
```

Si el proyecto ya existe:

```bash
cd MiNegocio
git pull origin main
```

Esto descarga las modificaciones realizadas en el repositorio.

---

# Paso 2. Instalar las dependencias

Las dependencias son las librerías que necesita el proyecto para funcionar.

## Backend

```bash
cd backend
npm ci
```

## Frontend

Abrir otra terminal:

```bash
cd MiNegocio/frontend
npm ci
```

Se utiliza `npm ci` porque instala las versiones especificadas en `package-lock.json`.

---

# 8. Configuración del archivo .env

El backend utiliza un archivo:

```text
backend/.env
```

Este archivo contiene configuraciones privadas.

Por seguridad, **no debe subirse a Git**.

Un ejemplo de configuración es:

```env
PORT=3000

DATABASE_URL="postgresql://postgres:1234@localhost:5433/minegocio?schema=public"

JWT_SECRET="UNA_CLAVE_LARGA_Y_SEGURA"

FRONTEND_URL="http://localhost:4200"

GOOGLE_CLIENT_ID="CLIENT_ID_DE_GOOGLE"

SUPERADMIN_EMAIL="admin@ejemplo.com"
SUPERADMIN_PASSWORD="UnaClaveSegura123!"
SUPERADMIN_NOMBRE="Administrador del sistema"
SUPERADMIN_CEDULA="0000000000"

CODE_TTL_MINUTES="5"
MAX_VERIFICATION_ATTEMPTS="5"

OLLAMA_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5:0.5b"
```

También pueden existir variables para:

* Resend.
* Google.
* PayPal.
* PayPhone.
* PocketBase.

Las credenciales reales deben ser proporcionadas de forma segura.

**Nunca se deben publicar contraseñas, tokens o claves privadas en GitHub.**

---

# 9. Base de datos PostgreSQL

PostgreSQL se ejecuta mediante Docker.

Desde:

```text
backend/
```

ejecutar:

```bash
docker compose up -d postgres
```

Comprobar:

```bash
docker compose ps
```

También se puede iniciar todo:

```bash
docker compose up -d
```

Esto puede iniciar:

* PostgreSQL.
* pgAdmin.
* PocketBase.

## PostgreSQL

La configuración utilizada por el proyecto puede utilizar:

```text
Host: localhost
Puerto: 5433
Base de datos: minegocio
Usuario: postgres
```

## pgAdmin

Si está habilitado:

```text
http://localhost:5050
```

---

# 10. Prisma

Prisma es el ORM utilizado para comunicarse con PostgreSQL.

En términos simples:

```text
Backend
   ↓
Prisma
   ↓
PostgreSQL
```

---

## Primera instalación

Cuando la base de datos está completamente nueva:

```bash
npx prisma migrate deploy
npx prisma generate
```

Si se necesitan datos de demostración:

```bash
npx prisma db seed
```

Finalmente:

```bash
npx prisma migrate status
```

Debe indicar que la base de datos está actualizada.

---

## Actualización de una base existente

Si ya existen datos importantes:

```bash
npx prisma migrate deploy
npx prisma generate
```

Esto aplica las migraciones pendientes sin borrar los datos existentes.

---

##  No utilizar normalmente

```bash
npx prisma migrate dev --name init
```

El proyecto ya contiene las migraciones.

Crear una migración `init` nueva puede generar conflictos.

Tampoco se debe utilizar como procedimiento normal:

```bash
npx prisma db push
```

El proyecto utiliza migraciones para mantener controlado el historial de cambios de la base de datos.

---

# 11. Ollama e inteligencia artificial

El sistema utiliza Ollama para generar recomendaciones de productos.

El modelo utilizado es:

```text
qwen2.5:0.5b
```

No es necesario entrenar el modelo.

---

## Instalar Ollama

Descargar e instalar Ollama en el equipo.

En Linux también puede instalarse mediante:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

En Windows se instala mediante el instalador de Ollama.

---

## Descargar el modelo

Desde:

```text
backend/
```

ejecutar:

```bash
npm run ai:setup
```

Esto descarga:

```text
qwen2.5:0.5b
```

Comprobar:

```bash
ollama list
```

También:

```bash
ollama ps
```

---

## ¿Tengo que ejecutar `ollama serve`?

Normalmente **no**.

Si Ollama ya está funcionando y se ejecuta:

```bash
ollama serve
```

puede aparecer:

```text
bind: address already in use
```

Esto significa que el puerto ya está siendo utilizado porque Ollama ya está ejecutándose.

---

## ¿Qué pasa si Ollama está apagado?

El sistema no deja de funcionar.

El backend utiliza automáticamente un ranking alternativo calculado con los datos disponibles.

Por lo tanto:

```text
Ollama funcionando
       ↓
Recomendaciones inteligentes

Ollama apagado
       ↓
Ranking alternativo
```

---

# 12. PocketBase y logos

PocketBase se utiliza para almacenar los logos de los negocios.

Se ejecuta mediante Docker.

---

## Construir PocketBase

Desde:

```text
backend/
```

la primera vez:

```bash
docker compose build pocketbase
```

Después:

```bash
docker compose up -d pocketbase
```

O directamente:

```bash
docker compose up -d --build pocketbase
```

---

## Comprobar PocketBase

```bash
docker compose ps pocketbase
```

Consultar los logs:

```bash
docker compose logs --tail=100 pocketbase
```

La API puede comprobarse con:

```bash
curl http://127.0.0.1:8090/api/health
```

Debe responder:

```json
{
  "message": "API is healthy.",
  "code": 200,
  "data": {}
}
```

En Windows PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:8090/api/health
```

---

## Panel de PocketBase

Abrir:

```text
http://localhost:8090/_/
```

La primera vez se debe crear el superusuario.

El sistema puede proporcionar un enlace de instalación en los logs:

```bash
docker compose logs pocketbase
```

---

## Colección de logos

En PocketBase debe existir:

```text
negocio_logos
```

Con el campo:

```text
negocioId
```

de tipo:

```text
Text
```

y un campo:

```text
logo
```

de tipo:

```text
File
```

Configuración recomendada:

```text
Max files: 1
Max size: 2097152 bytes
```

Formatos:

```text
image/jpeg
image/png
image/webp
```

Esto permite almacenar un logo de hasta aproximadamente 2 MB.

---

# 13. Sistema de correos

El sistema utiliza **Resend** para enviar correos.

Se utiliza para:

* Activación de cuentas.
* Recuperación de contraseña.
* Envío de facturas.

También se utiliza:

```text
Puppeteer
```

para generar el PDF de la factura.

---

## ¿Cómo funciona?

Cuando se genera una factura:

```text
Venta
  ↓
Backend
  ↓
Plantilla HTML
  ↓
Puppeteer
  ↓
PDF Buffer
  ↓
Resend
  ↓
Correo del cliente
```

No se necesitan archivos PDF temporales.

Puppeteer utiliza la misma plantilla HTML de la factura para generar el PDF.

---

## Dominio de correo

El sistema fue configurado utilizando:

```text
mail.fapd.app
```

como dominio dedicado para correo.

El dominio fue verificado en Resend mediante registros DNS:

```text
DKIM
SPF
MX
```

El remitente puede utilizar una dirección similar a:

```text
noreply@mail.fapd.app
```

Si se necesita modificar nuevamente la configuración DNS, se debe tener acceso a la cuenta que administra el dominio.

---

# 14. Ejecutar el sistema

Una vez completada la instalación existen dos procesos principales:

```text
BACKEND
FRONTEND
```

---

## Terminal 1: Backend

```bash
cd backend
npm run dev
```

El backend estará disponible normalmente en:

```text
http://localhost:3000
```

---

## Terminal 2: Frontend

```bash
cd frontend
npm start
```

Angular estará disponible en:

```text
http://localhost:4200
```

---

# 15. Cómo utilizar el sistema

Una vez iniciado:

```text
http://localhost:4200
```

el usuario puede acceder al sistema.

---

## Cliente

Un cliente puede:

1. Registrarse.
2. Registrarse utilizando Google.
3. Verificar su correo.
4. Iniciar sesión.
5. Recuperar su contraseña.
6. Entrar al ecommerce.
7. Ver productos.
8. Utilizar el carrito.
9. Realizar pedidos.
10. Consultar su información.

Cuando un cliente se registra mediante Google, el sistema lo identifica automáticamente como cliente y lo dirige al ecommerce.

---

## Usuario administrativo

Los usuarios internos ingresan al panel administrativo dependiendo de su rol.

Desde allí pueden trabajar con:

* Productos.
* Inventario.
* Clientes.
* Usuarios.
* Ventas.
* Caja.
* Reportes.
* Negocios.

---

# 16. Roles de usuario

El sistema utiliza los siguientes roles:

| Rol           | Función general                    |
| ------------- | ---------------------------------- |
| SUPERADMIN    | Administración general del sistema |
| ADMINISTRADOR | Administración del negocio         |
| VENDEDOR      | Gestión relacionada con ventas     |
| CAJERO        | Operación de caja                  |
| CLIENTE       | Uso del ecommerce                  |

Los permisos son controlados desde el backend.

No basta con ocultar una pantalla en Angular.

El backend también verifica:

```text
JWT
 ↓
Rol
 ↓
Permiso
 ↓
Operación
```

---

# 17. Módulos

##  Autenticación

Incluye:

* Login.
* Registro.
* JWT.
* Google OAuth.
* Verificación por correo.
* Códigos de 6 dígitos.
* Expiración de códigos.
* Límite de intentos.
* Recuperación de contraseña.
* Cambio de contraseña.
* Cierre automático cuando el token expira.

---

##  Perfil

Todos los usuarios pueden acceder a su perfil.

Pueden modificar:

* Nombre.
* Cédula/RUC.
* Correo.
* Contraseña.

El sistema verifica que no existan datos duplicados.

---

##  Clientes

El sistema permite:

* Crear clientes.
* Buscar clientes.
* Asociarlos a negocios.
* Validar correo.
* Validar documento de identidad.
* Editar clientes.
* Utilizarlos desde caja.

Un cliente puede estar relacionado con uno o varios negocios mediante:

```text
ClienteNegocio
```

---

##  Usuarios

La administración de usuarios incluye:

* Filtros.
* Validaciones.
* Confirmaciones.
* Control de roles.
* Manejo de errores.
* Mensajes mediante Toast.

---

##  Productos

Permite:

* Crear productos.
* Editarlos.
* Consultarlos.
* Controlar stock.
* Subir imágenes.
* Desactivar productos.

El sistema utiliza **borrado lógico**.

En lugar de eliminar físicamente un producto:

```text
activo = false
```

Esto permite conservar la información histórica.

También existe una sección para consultar productos eliminados/desactivados.

---

## Caja / POS

La caja permite:

* Buscar productos.
* Agregar productos al carrito.
* Buscar clientes.
* Crear clientes.
* Asociar clientes.
* Calcular totales.
* Procesar ventas.
* Actualizar inventario.

El sistema valida que el stock disponible sea suficiente antes de confirmar una venta.

---

## Ecommerce

La tienda pública permite:

* Ver productos.
* Filtrar productos.
* Ver negocios.
* Agregar productos al carrito.
* Modificar cantidades.
* Eliminar productos.
* Mantener el carrito mediante `localStorage`.
* Realizar pedidos.

La clave utilizada para el carrito es:

```text
carrito_tienda
```

---

##  Reportes
Los reportes muestran información como:

* Ingresos.
* Cantidad de ventas.
* Productos vendidos.
* Stock crítico.
* Tendencias.
* Historial de ventas.
* Métodos de pago.

También pueden utilizar recomendaciones generadas mediante Ollama.

---

# 18. Arquitectura

La arquitectura general puede entenderse así:

```text
                    USUARIO
                       │
                       ▼
                  ANGULAR
                       │
              HTTP / WebSocket
                       │
                       ▼
               NODE + EXPRESS
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Prisma       Socket.IO    Servicios
          │
          ▼
      PostgreSQL
```

Servicios adicionales:

```text
                    BACKEND
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
 PostgreSQL        PocketBase         Ollama
       │               │                │
       │               │                │
       ▼               ▼                ▼
   Datos           Logos          Recomendaciones

                    BACKEND
                       │
              ┌────────┴────────┐
              ▼                 ▼
           Resend             Google
              │                 │
              ▼                 ▼
           Correos           OAuth
```

---

# 19. Seguridad

La aplicación implementa diferentes mecanismos de seguridad.

---

## JWT

Las sesiones utilizan JSON Web Tokens.

El frontend almacena el token y el interceptor de Angular lo agrega automáticamente a las solicitudes.

Si el backend responde:

```text
401 Unauthorized
```

por un token inválido o expirado, el frontend cierra la sesión.

---

## Roles

Cada endpoint protegido puede verificar:

```text
verificarToken
```

y:

```text
verificarRol
```

Esto evita que un usuario ejecute operaciones que no corresponden a su rol.

---

## Contraseñas

Las credenciales sensibles se manejan desde el backend.

No se deben colocar:

* Contraseñas.
* Tokens.
* Secretos.
* Claves privadas.

dentro del código de Angular.

---

## Variables de entorno

Las variables sensibles se mantienen en:

```text
backend/.env
```

El archivo `.env` no debe subirse al repositorio.

---

# 20. Comunicación en tiempo real

El sistema utiliza:

```text
WebSocket / Socket.IO
```

para enviar información sin necesidad de recargar la página.

Por ejemplo:

```text
Usuario A vende producto
        ↓
Backend
        ↓
Actualiza PostgreSQL
        ↓
Socket.IO
        ↓
Otros usuarios conectados
        ↓
Stock actualizado
```

Cada negocio tiene su propia sala de WebSocket.

Por ejemplo:

```text
negocioId = 25
        ↓
socket.join(25)
```

Esto evita enviar información de un negocio a usuarios de otro negocio.

---

# 21. Facturación y envío de PDF

Cuando una venta es confirmada:

```text
Cliente
   ↓
Caja / Ecommerce
   ↓
Backend
   ↓
Validación
   ↓
Transacción PostgreSQL
   ↓
Venta confirmada
   ↓
Factura
```

La factura utiliza una plantilla HTML.

Puppeteer toma esa misma plantilla y genera un PDF:

```text
HTML
 ↓
Puppeteer
 ↓
Buffer
 ↓
PDF
```

El usuario puede descargar el PDF mediante un `Blob`, evitando abrir pestañas adicionales del navegador.

También puede enviarse por correo mediante Resend.

---

# 22. Pagos

El sistema contempla diferentes métodos de pago.

En caja se manejan métodos como:

```text
Efectivo
PayPhone
Kushki
```

Para ecommerce se contempla:

```text
PayPal
PayPhone
Tarjeta
```

El principio importante es que **el pago no debe considerarse confirmado únicamente porque el frontend diga que tuvo éxito**.

La confirmación debe ser validada en el backend.

El flujo esperado es:

```text
Ecommerce
    ↓
Pedido
    ↓
Pago
    ↓
Validación backend
    ↓
Pago confirmado
    ↓
Venta
    ↓
Descuento de stock
    ↓
Factura
```

La caja física puede continuar generando ventas directamente.

---

# 23. Consistencia de datos

Uno de los objetivos importantes del proyecto es evitar errores cuando varias personas venden el mismo producto simultáneamente.

Por ejemplo:

```text
Stock = 1

Cajero A → intenta vender
Cajero B → intenta vender
```

El backend utiliza transacciones de PostgreSQL mediante Prisma.

La idea es:

```text
Cajero A ──┐
           ├── PostgreSQL ──→ solo una venta puede confirmar
Cajero B ──┘
```

Así se evita que el inventario termine con:

```text
Stock = -1
```

---

# 24. Observabilidad

El backend cuenta con un sistema de logs.

Los registros se almacenan en:

```text
backend/logs/
```

Estos registros sirven para:

* Detectar errores.
* Revisar operaciones.
* Facilitar depuración.
* Auditar determinados eventos.

---

# 25. Comandos útiles

## Ver contenedores

```bash
docker compose ps
```

---

## Iniciar todo

```bash
docker compose up -d
```

---

## Detener contenedores

```bash
docker compose stop
```

---

## Reiniciar

```bash
docker compose restart
```

---

## Ver logs

```bash
docker compose logs --tail=100
```

Para PocketBase:

```bash
docker compose logs --tail=100 pocketbase
```

---

## Verificar PocketBase

```bash
curl http://127.0.0.1:8090/api/health
```

---

## Ver estado de Prisma

```bash
npx prisma migrate status
```

---

## Generar Prisma Client

```bash
npx prisma generate
```

---

## Aplicar migraciones

```bash
npx prisma migrate deploy
```

---

## Preparar IA

```bash
npm run ai:setup
```

---

## Ver modelos de Ollama

```bash
ollama list
```

---

# 26. Actualizar el sistema

Cuando ya existe una instalación funcionando:

```bash
git pull origin main
```

Después:

```bash
cd backend
npm ci
```

Aplicar las migraciones:

```bash
npx prisma migrate deploy
npx prisma generate
```

Actualizar los contenedores:

```bash
docker compose up -d --build
```

Después reiniciar el backend.

En otra terminal:

```bash
cd frontend
npm ci
npm start
```

---

## Si cambió PocketBase

Si se modificó el Dockerfile de PocketBase:

```bash
docker compose up -d --build pocketbase
```

No es necesario crear nuevamente:

* El superusuario.
* La colección.
* El volumen.

si la instalación anterior ya está configurada.

---

# 27. Problemas frecuentes

## Docker no funciona

Primero abrir:

```text
Docker Desktop
```

Esperar hasta que Docker indique que está funcionando.

Comprobar:

```bash
docker info
```

Si devuelve información del servidor, Docker está funcionando.

---

## Puerto 11434 ocupado

Si Ollama muestra:

```text
bind: address already in use
```

no significa necesariamente que exista un problema.

Normalmente significa que Ollama ya está ejecutándose.

Comprobar:

```bash
ollama list
```

---

## PostgreSQL no inicia

Comprobar:

```bash
docker compose ps
```

y:

```bash
docker compose logs postgres
```

---

## Prisma indica migraciones pendientes

Ejecutar:

```bash
npx prisma migrate status
```

Si existen migraciones pendientes:

```bash
npx prisma migrate deploy
npx prisma generate
```

---

## El frontend no se conecta al backend

Comprobar que el backend esté ejecutándose:

```text
http://localhost:3000
```

Y revisar:

```text
frontend/src/environments/environment.development.ts
```

La API debe apuntar normalmente a:

```text
http://localhost:3000/api
```

---

## No llegan correos

Comprobar:

1. Variables de Resend.
2. Dominio verificado.
3. Dirección remitente.
4. Configuración DNS.
5. Logs del backend.

---

## No aparecen recomendaciones de IA

Comprobar:

```bash
ollama list
```

Debe aparecer:

```text
qwen2.5:0.5b
```

También comprobar que Ollama esté funcionando:

```bash
ollama ps
```

Si Ollama no está disponible, el sistema utilizará el ranking alternativo.

---

# 28.  Comandos peligrosos

## NO ejecutar en una base con información importante

```bash
npx prisma migrate reset --force
```

Este comando elimina los datos de la base y vuelve a aplicar las migraciones.

---

## NO ejecutar si se quieren conservar los datos de Docker

```bash
docker compose down -v
```

La opción:

```text
-v
```

elimina los volúmenes.

Esto puede eliminar información almacenada por:

* PostgreSQL.
* PocketBase.
* Otros servicios que utilicen volúmenes.

---

## Antes de eliminar una base

Realizar una copia de seguridad.

Por ejemplo:

```bash
pg_dump -h localhost -p 5433 -U postgres -d minegocio -F c -f minegocio.backup
```

Después de tener el respaldo se puede analizar el problema sin arriesgar la información.

---

# 29. Flujo completo de una instalación nueva

Para una persona que simplemente quiere instalar el proyecto, el proceso completo es:

```text
1. Instalar Git
        ↓
2. Instalar Node.js
        ↓
3. Instalar Docker Desktop
        ↓
4. Instalar Ollama
        ↓
5. Clonar proyecto
        ↓
6. npm ci en backend
        ↓
7. npm ci en frontend
        ↓
8. Crear/configurar backend/.env
        ↓
9. docker compose up -d
        ↓
10. prisma migrate deploy
        ↓
11. prisma generate
        ↓
12. prisma db seed (solo si corresponde)
        ↓
13. npm run ai:setup
        ↓
14. Configurar PocketBase
        ↓
15. npm run dev
        ↓
16. npm start
        ↓
17. Abrir localhost:4200
```

---

# 30. Checklist final

Antes de considerar terminada la instalación:

* [ ] Git instalado.
* [ ] Node.js instalado.
* [ ] npm funcionando.
* [ ] Docker instalado.
* [ ] Docker Desktop funcionando.
* [ ] Ollama instalado.
* [ ] Proyecto clonado.
* [ ] Dependencias del backend instaladas.
* [ ] Dependencias del frontend instaladas.
* [ ] `.env` configurado.
* [ ] PostgreSQL funcionando.
* [ ] Migraciones aplicadas.
* [ ] Prisma Client generado.
* [ ] Seed ejecutado si corresponde.
* [ ] Modelo `qwen2.5:0.5b` instalado.
* [ ] PocketBase funcionando.
* [ ] Superusuario de PocketBase creado.
* [ ] Colección `negocio_logos` creada.
* [ ] Configuración de correo disponible.
* [ ] Backend funcionando.
* [ ] Frontend funcionando.
* [ ] Login probado.
* [ ] Registro probado.
* [ ] Google OAuth probado.
* [ ] Productos visibles.
* [ ] Inventario funcionando.
* [ ] Caja funcionando.
* [ ] Clientes funcionando.
* [ ] Factura generándose.
* [ ] PDF descargándose.
* [ ] Correo de factura probado.
* [ ] Ecommerce funcionando.
* [ ] Carrito funcionando.
* [ ] Recomendaciones probadas.
* [ ] No ejecutar `docker compose down -v` si existen datos importantes.

---

# 31. Resumen para una persona que nunca ha usado el proyecto

Si nunca has utilizado **Mi Negocio Al Día**, solamente debes recordar esto:

### Docker

Se encarga de ejecutar los servicios que necesita el sistema, principalmente PostgreSQL y PocketBase.

```bash
docker compose up -d
```

### Backend

Es el servidor que controla las reglas del sistema.

```bash
cd backend
npm run dev
```

### Frontend

Es la página que utiliza el usuario.

```bash
cd frontend
npm start
```

### PostgreSQL

Guarda los datos.

### Prisma

Permite que el backend trabaje con PostgreSQL.

```bash
npx prisma migrate deploy
npx prisma generate
```

### Ollama

Genera las recomendaciones de productos.

```bash
npm run ai:setup
```

### PocketBase

Almacena los logos de los negocios.

```text
http://localhost:8090/_/
```

### Sistema

Finalmente se abre:

```text
http://localhost:4200
```

Y ya se puede utilizar **Mi Negocio Al Día**.

---

# 32. Flujo de funcionamiento del sistema

En términos sencillos:

```text
                 USUARIO
                    │
                    ▼
              ┌───────────┐
              │  ANGULAR  │
              └─────┬─────┘
                    │
             HTTP / WebSocket
                    │
                    ▼
              ┌───────────┐
              │  BACKEND  │
              │ Node/     │
              │ Express   │
              └─────┬─────┘
                    │
        ┌───────────┼────────────┐
        │           │            │
        ▼           ▼            ▼
   PostgreSQL   PocketBase     Ollama
        │           │            │
        ▼           ▼            ▼
     Datos        Logos      Recomendaciones

                    │
                    ▼
             Servicios externos
              ┌─────┴──────┐
              │            │
            Resend       Google
              │            │
              ▼            ▼
           Correos       Login
```

De esta manera, cada componente tiene una responsabilidad concreta y el usuario solamente necesita interactuar con la aplicación desde el navegador.

---

## Estado del proyecto

**Mi Negocio Al Día** integra actualmente:

* Sistema multiempresa.
* Autenticación JWT.
* Google OAuth.
* Registro y verificación por correo.
* Recuperación de contraseña.
* Gestión de usuarios.
* Gestión de clientes.
* Gestión de negocios.
* Gestión de productos.
* Inventario.
* Caja/POS.
* Ventas.
* Facturación.
* Generación de PDF.
* Envío de facturas por correo.
* Ecommerce.
* Carrito persistente.
* Pagos electrónicos.
* WebSockets.
* Notificaciones Toast.
* PostgreSQL.
* Prisma.
* Docker.
* PocketBase.
* Ollama.
* Recomendaciones mediante IA.
* Reportes y analítica.
* Control de acceso por roles.
* Manejo centralizado de errores.
* Logs y auditoría.
* Protección de archivos.
* Validaciones de datos.
* Control de concurrencia.

El objetivo principal es proporcionar una plataforma que permita a un negocio gestionar sus operaciones desde un único sistema, manteniendo la información centralizada, protegida y sincronizada entre los diferentes usuarios y dispositivos.



