import { Server } from 'socket.io';
import { prisma } from '../config/database';
import { logger } from './logger.service';
import { StockInsuficienteError } from '../errors/app.error';

export class VentasService {
    async registrarVenta(
        data: {
            socioId: string;    // quién registra (auditoría)
            negocioId: string;  // a qué negocio pertenece la venta
            clienteId: string;  // a quién se le vende
            metodoPago: string; // PAYPHONE, KUSHKI, EFECTIVO
            detalles: {
                productoId: string;
                cantidad: number;
                precioUnit: number;
            }[];
        },
        io: Server
    ) {
        logger.info(`Iniciando venta transaccional — negocio: ${data.negocioId} — cajero: ${data.socioId}`, 'VentasService');

        return await prisma.$transaction(async (tx) => {
            // 1. Validar stock de cada ítem antes de tocar nada
            for (const item of data.detalles) {
                const producto = await tx.producto.findUnique({
                    where: { id: item.productoId }
                });
                if (!producto || producto.stock < item.cantidad) {
                    logger.warn(`Stock insuficiente para producto ${item.productoId}`, 'VentasService');
                    throw new StockInsuficienteError(producto?.nombre || 'Desconocido');
                }
            }

            // 2. Recalcular de forma segura los totales en el lado del servidor
            const subtotalCalculado = data.detalles.reduce(
                (acc, item) => acc + (item.cantidad * item.precioUnit),
                0
            );
            const impuestosCalculados = subtotalCalculado * 0.15; // IVA 15%
            const totalCalculado = subtotalCalculado + impuestosCalculados;

            // 3. Crear la venta con todos los campos necesarios para la factura
            const venta = await tx.venta.create({
                data: {
                    negocioId: data.negocioId,
                    socioId: data.socioId,
                    clienteId: data.clienteId,
                    metodoPago: data.metodoPago || 'EFECTIVO',
                    subtotal: subtotalCalculado,
                    impuestos: impuestosCalculados,
                    total: totalCalculado,
                    detalles: {
                        create: data.detalles.map(item => ({
                            productoId: item.productoId,
                            cantidad: item.cantidad,
                            precioUnit: item.precioUnit
                        }))
                    }
                }
            });

            // 4. Descontar stock y emitir evento en tiempo real
            for (const item of data.detalles) {
                const actualizado = await tx.producto.update({
                    where: { id: item.productoId },
                    data: { stock: { decrement: item.cantidad } }
                });

                // Asegurar que tu evento coincida con el que escucha tu frontend
                io.emit('stock:actualizado', {
                    productoId: item.productoId,
                    nuevoStock: actualizado.stock
                });
            }

            logger.info(`Venta ${venta.id} completada. Total: $${totalCalculado}`, 'VentasService');

            // 🚨 CRUCIAL: Retornar la venta completa para que Angular capture el ID y abra la factura
            return venta;
        });
    }
}