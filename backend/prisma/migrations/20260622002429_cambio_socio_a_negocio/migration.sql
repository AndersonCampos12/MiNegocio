/*
  Warnings:

  - You are about to drop the column `socio_id` on the `productos` table. All the data in the column will be lost.
  - Added the required column `negocio_id` to the `productos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `negocio_id` to the `ventas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "productos" DROP CONSTRAINT "productos_socio_id_fkey";

-- AlterTable
ALTER TABLE "productos" DROP COLUMN "socio_id",
ADD COLUMN     "negocio_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "negocio_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
