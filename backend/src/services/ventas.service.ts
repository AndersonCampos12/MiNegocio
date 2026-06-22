import { Server } from 'socket.io';
import { prisma } from '../config/database';
import { logger } from './logger.service';
import { StockInsuficienteError } from '../errors/app.error';

export class VentasService {
    async registrarVenta(
        data: {
            socioId: string;    // quién registra (auditoría)
            negocioId: string;  // a qué negocio pertenece la venta
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
            // Validar stock de cada ítem antes de tocar nada
            for (const item of data.detalles) {
                const producto = await tx.producto.findUnique({
                    where: { id: item.productoId }
                });
                if (!producto || producto.stock < item.cantidad) {
                    logger.warn(`Stock insuficiente para producto ${item.productoId}`, 'VentasService');
                    throw new StockInsuficienteError(producto?.nombre || 'Desconocido');
                }
            }

            const total = data.detalles.reduce(
                (acc, item) => acc + item.cantidad * item.precioUnit,
                0
            );

            // Crear la venta con negocioId (pertenencia) y socioId (auditoría)
            const venta = await tx.venta.create({
                data: {
                    negocioId: data.negocioId,
                    socioId: data.socioId,
                    total,
                    detalles: {
                        create: data.detalles.map(item => ({
                            productoId: item.productoId,
                            cantidad: item.cantidad,
                            precioUnit: item.precioUnit
                        }))
                    }
                }
            });

            // Descontar stock y emitir evento en tiempo real
            for (const item of data.detalles) {
                const actualizado = await tx.producto.update({
                    where: { id: item.productoId },
                    data: { stock: { decrement: item.cantidad } }
                });
                io.emit('stock:actualizado', {
                    productoId: item.productoId,
                    nuevoStock: actualizado.stock
                });
            }

            logger.info(`Venta ${venta.id} completada. Total: $${total}`, 'VentasService');
            return venta;
        });
    }
}