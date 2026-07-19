-- Datos temporales para activar de forma segura cuentas creadas o reclamadas por clientes.
ALTER TABLE "socios"
ADD COLUMN "codigo_verificacion_hash" TEXT,
ADD COLUMN "codigo_verificacion_expira" TIMESTAMP(3),
ADD COLUMN "codigo_verificacion_enviado_en" TIMESTAMP(3),
ADD COLUMN "intentos_verificacion" INTEGER NOT NULL DEFAULT 0;
