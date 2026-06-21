-- CreateEnum
CREATE TYPE "EstadoNegocio" AS ENUM ('PENDIENTE', 'ACTIVO', 'BLOQUEADO');

-- AlterTable
ALTER TABLE "negocios" ADD COLUMN     "estado" "EstadoNegocio" NOT NULL DEFAULT 'PENDIENTE';
