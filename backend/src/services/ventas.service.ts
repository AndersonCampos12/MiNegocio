import { Server } from 'socket.io';
import { prisma } from '../config/database'; // <-- Patrón Singleton (2.1.2)
import { logger } from './logger.service'; // <-- Observabilidad (2.2.2)
import { StockInsuficienteError } from '../errors/app.error'; // <-- Manejo de Excepciones (2.1.4)

export class VentasService {
    async registrarVenta(data: { socioId: string; detalles: { productoId: string; cantidad: number; precioUnit: number }[] }, io: Server) {

        logger.info(`Iniciando intento de venta transaccional para socio: ${data.socioId}`, 'VentasService');

        // Manejo de Transacciones ACID (2.1.3)
        return await prisma.$transaction(async (tx) => {

            for (const item of data.detalles) {
                const producto = await tx.producto.findUnique({ where: { id: item.productoId } });

                if (!producto || producto.stock < item.cantidad) {
                    logger.warn(`Fallo de consistencia ACID: Stock insuficiente para id ${item.productoId}`, 'VentasService');
                    // Excepción lanzada en capa de servicios (2.1.4)
                    throw new StockInsuficienteError(producto?.nombre || 'Desconocido');
                }
            }

            const total = data.detalles.reduce((acc, item) => acc + (item.cantidad * item.precioUnit), 0);

            const venta = await tx.venta.create({
                data: {
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

            // Descuento de stock concurrente y emisión reactiva
            for (const item of data.detalles) {
                const actualizado = await tx.producto.update({
                    where: { id: item.productoId },
                    data: { stock: { decrement: item.cantidad } }
                });

                // Emisión asíncrona ("Hilos/Eventos") a terminales Angular
                io.emit('stock:actualizado', {
                    productoId: item.productoId,
                    nuevoStock: actualizado.stock
                });
            }

            logger.info(`Venta ${venta.id} procesada exitosamente. Total: $${total}`, 'VentasService');
            return venta;
        });
    }
}