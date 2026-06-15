import { Server } from 'socket.io';
import { prisma } from '../index';

export class VentasService {
    async registrarVenta(data: { socioId: string; detalles: { productoId: string; cantidad: number; precioUnit: number }[] }, io: Server) {
        return await prisma.$transaction(async (tx) => {
            // 1. Verificar stock de todos los productos antes de vender
            for (const item of data.detalles) {
                const producto = await tx.producto.findUnique({
                    where: { id: item.productoId }
                });

                if (!producto || producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para el producto seleccionado`);
                }
            }

            // 2. Calcular el total de la venta
            const total = data.detalles.reduce((acc, item) => acc + (item.cantidad * item.precioUnit), 0);

            // 3. Registrar la venta y sus detalles
            const venta = await tx.venta.create({
                data: {
                    socioId: data.socioId,
                    total: total,
                    detalles: {
                        create: data.detalles.map(item => ({
                            productoId: item.productoId,
                            cantidad: item.cantidad,
                            precioUnit: item.precioUnit
                        }))
                    }
                }
            });

            // 4. Descontar stock y emitir evento WebSocket a todos los socios
            for (const item of data.detalles) {
                const actualizado = await tx.producto.update({
                    where: { id: item.productoId },
                    data: { stock: { decrement: item.cantidad } }
                });

                // Emitir evento en tiempo real para que Angular actualice la vista
                io.emit('stock:actualizado', {
                    productoId: item.productoId,
                    nuevoStock: actualizado.stock
                });
            }

            return venta;
        });
    }
}