CREATE TYPE "PropositoCodigo" AS ENUM ('ACTIVACION', 'RECUPERACION');

ALTER TABLE "socios"
ADD COLUMN "proposito_codigo" "PropositoCodigo";

UPDATE "socios"
SET "proposito_codigo" = 'ACTIVACION'
WHERE "codigo_verificacion_hash" IS NOT NULL;
