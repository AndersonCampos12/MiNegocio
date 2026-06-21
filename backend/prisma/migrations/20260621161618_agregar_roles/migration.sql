/*
  Warnings:

  - The values [ADMIN] on the enum `Rol` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `socio_id` on the `sesiones_caja` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `socios` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `socios` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Rol_new" AS ENUM ('ADMINISTRADOR', 'VENDEDOR', 'CLIENTE');
ALTER TABLE "public"."socios" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "socios" ALTER COLUMN "rol" TYPE "Rol_new" USING ("rol"::text::"Rol_new");
ALTER TYPE "Rol" RENAME TO "Rol_old";
ALTER TYPE "Rol_new" RENAME TO "Rol";
DROP TYPE "public"."Rol_old";
ALTER TABLE "socios" ALTER COLUMN "rol" SET DEFAULT 'CLIENTE';
COMMIT;

-- DropForeignKey
ALTER TABLE "sesiones_caja" DROP CONSTRAINT "sesiones_caja_socio_id_fkey";

-- DropIndex
DROP INDEX "socios_username_key";

-- AlterTable
ALTER TABLE "sesiones_caja" DROP COLUMN "socio_id";

-- AlterTable
ALTER TABLE "socios" DROP COLUMN "estado",
DROP COLUMN "username",
ALTER COLUMN "rol" SET DEFAULT 'CLIENTE';
