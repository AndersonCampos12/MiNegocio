import { prisma } from '../config/database';

export class ReportesService {
    async obtenerMetricas(negocioId: string) {

        // 1. Sumamos el dinero total y contamos los tickets de venta de todo el negocio
        const agregaciones = await prisma.venta.aggregate({
            where: { negocioId },
            _sum: { total: true },
            _count: { id: true }
        });

        // 2. Contamos cuántos productos están en alerta roja (menos de 10 unidades)
        const productosBajoStock = await prisma.producto.count({
            where: {
                negocioId: negocioId,
                stock: {
                    lt: 10
                }
            }
        });

        // 3. Traemos el historial: las 5 ventas más recientes
        const ultimasVentas = await prisma.venta.findMany({
            where: { negocioId },
            orderBy: { creadoEn: 'desc' },
            take: 5,
            include: {
                detalles: true, // Incluimos esto para saber cuántos items compraron
                socio: {        // 👤 NUEVO: Incluimos la relación del vendedor/cajero
                    select: {
                        nombre: true
                    }
                }
            }
        });

        const productosAgrupados = await prisma.detalleVenta.groupBy({
            by: ['productoId'],
            where: { venta: { negocioId } },
            _sum: { cantidad: true },
            orderBy: { _sum: { cantidad: 'desc' } },
            take: 5
        });
        const productos = await prisma.producto.findMany({
            where: { id: { in: productosAgrupados.map(item => item.productoId) } },
            select: { id: true, nombre: true }
        });
        const productosPorId = new Map(productos.map(producto => [producto.id, producto]));

        // 4. Empaquetamos todo y lo mandamos listo al Frontend
        return {
            ingresosTotales: agregaciones._sum.total || 0,
            totalVentas: agregaciones._count.id || 0,
            alertasStock: productosBajoStock,
            topProductos: productosAgrupados.flatMap(item => {
                const producto = productosPorId.get(item.productoId);
                return producto ? [{
                    ...producto,
                    cantidadVendida: item._sum.cantidad || 0
                }] : [];
            }),

            // Formateamos las ventas para que el HTML de Angular las dibuje fácil
            ultimasVentas: ultimasVentas.map(venta => ({
                id: venta.id, // 🚨 CORRECCIÓN: Mandar completo para que funcione el botón de imprimir factura
                total: venta.total,
                fecha: venta.creadoEn,
                metodoPago: venta.metodoPago, // 💳 NUEVO: Enviamos el método de pago (EFECTIVO, PAYPHONE, KUSHKI)
                socio: venta.socio,           // 👤 NUEVO: Pasamos el objeto del socio con su nombre
                cantidadItems: venta.detalles.reduce((acc, det) => acc + det.cantidad, 0)
            }))
        };
    }
}
