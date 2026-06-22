/*
  Warnings:

  - A unique constraint covering the columns `[cedula]` on the table `socios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "socios" ADD COLUMN     "cedula" TEXT;

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "cliente_id" TEXT,
ADD COLUMN     "impuestos" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "socios_cedula_key" ON "socios"("cedula");

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "socios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
