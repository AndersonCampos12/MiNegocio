/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `socios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `socio_id` to the `sesiones_caja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `socios` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'VENDEDOR', 'CLIENTE');

-- AlterTable
ALTER TABLE "sesiones_caja" ADD COLUMN     "socio_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "socios" ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rol" "Rol" NOT NULL DEFAULT 'VENDEDOR',
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "socios_username_key" ON "socios"("username");

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
