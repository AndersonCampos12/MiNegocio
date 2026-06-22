/*
  Warnings:

  - You are about to drop the column `negocio_id` on the `socios` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "socios" DROP CONSTRAINT "socios_negocio_id_fkey";

-- AlterTable
ALTER TABLE "socios" DROP COLUMN "negocio_id",
ADD COLUMN     "negocioId" TEXT;

-- AddForeignKey
ALTER TABLE "socios" ADD CONSTRAINT "socios_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "negocios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
