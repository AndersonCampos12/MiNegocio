-- La identidad del cliente es global; su relación comercial pertenece a cada negocio.
ALTER TABLE "socios"
ADD COLUMN "cuenta_activada" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "clientes_negocios" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "negocio_id" TEXT NOT NULL,
    "nombre_referencia" TEXT,
    "email_contacto" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_negocios_pkey" PRIMARY KEY ("id")
);

-- Conserva las relaciones de los clientes existentes antes de dejarlos globales.
INSERT INTO "clientes_negocios" (
    "id", "cliente_id", "negocio_id", "nombre_referencia", "email_contacto"
)
SELECT
    concat('migrated-', "id", '-', "negocioId"),
    "id",
    "negocioId",
    "nombre",
    "email"
FROM "socios"
WHERE "rol" = 'CLIENTE' AND "negocioId" IS NOT NULL;

UPDATE "socios"
SET "cuenta_activada" = false
WHERE "rol" = 'CLIENTE' AND "password" = 'CLIENTE_SIN_ACCESO_PASSWORD';

UPDATE "socios"
SET "negocioId" = NULL
WHERE "rol" = 'CLIENTE';

CREATE UNIQUE INDEX "clientes_negocios_cliente_id_negocio_id_key"
ON "clientes_negocios"("cliente_id", "negocio_id");

CREATE INDEX "clientes_negocios_negocio_id_idx"
ON "clientes_negocios"("negocio_id");

ALTER TABLE "clientes_negocios"
ADD CONSTRAINT "clientes_negocios_cliente_id_fkey"
FOREIGN KEY ("cliente_id") REFERENCES "socios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clientes_negocios"
ADD CONSTRAINT "clientes_negocios_negocio_id_fkey"
FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
