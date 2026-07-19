/*
  Warnings:

  - A unique constraint covering the columns `[pedido_id]` on the table `ventas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE_PAGO', 'PAGADO', 'CANCELADO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "ProveedorPago" AS ENUM ('PAYPAL', 'PAYPHONE');

-- DropForeignKey
ALTER TABLE "ventas" DROP CONSTRAINT "ventas_socio_id_fkey";

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "pedido_id" TEXT,
ALTER COLUMN "socio_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "negocio_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "impuestos" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "proveedor_pago" "ProveedorPago",
    "referencia_orden_pago" TEXT,
    "referencia_pago" TEXT,
    "expira_en" TIMESTAMP(3),
    "pagado_en" TIMESTAMP(3),
    "cancelado_en" TIMESTAMP(3),
    "entregado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_pedidos" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "precio_unit" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "detalle_pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pedidos_cliente_id_creado_en_idx" ON "pedidos"("cliente_id", "creado_en");

-- CreateIndex
CREATE INDEX "pedidos_negocio_id_estado_idx" ON "pedidos"("negocio_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_proveedor_pago_referencia_orden_pago_key" ON "pedidos"("proveedor_pago", "referencia_orden_pago");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_proveedor_pago_referencia_pago_key" ON "pedidos"("proveedor_pago", "referencia_pago");

-- CreateIndex
CREATE INDEX "detalle_pedidos_producto_id_idx" ON "detalle_pedidos"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "detalle_pedidos_pedido_id_producto_id_key" ON "detalle_pedidos"("pedido_id", "producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_pedido_id_key" ON "ventas"("pedido_id");

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedidos" ADD CONSTRAINT "detalle_pedidos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedidos" ADD CONSTRAINT "detalle_pedidos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
