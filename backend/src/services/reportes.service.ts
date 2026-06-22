import { prisma } from '../config/database';

export class ReportesService {
    async obtenerMetricas(negocioId: string) {

        // 1. Sumamos el dinero total y contamos los tickets de venta de todo el negocio
        const agregaciones = await prisma.venta.aggregate({
            where: { socio: { negocioId: negocioId } },
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
            where: { socio: { negocioId: negocioId } },
            orderBy: { creadoEn: 'desc' },
            take: 5,
            include: {
                detalles: true // Incluimos esto para saber cuántos items compraron en cada venta
            }
        });

        // 4. Empaquetamos todo y lo mandamos limpiecito al Frontend
        return {
            ingresosTotales: agregaciones._sum.total || 0,
            totalVentas: agregaciones._count.id || 0,
            alertasStock: productosBajoStock,

            // Formateamos las ventas para que el HTML de Angular las dibuje fácil
            ultimasVentas: ultimasVentas.map(venta => ({
                id: venta.id.split('-')[0], // Extraemos solo el primer bloque del UUID para que se vea estético
                total: venta.total,
                fecha: venta.creadoEn,
                // Sumamos la cantidad de todos los detalles de esa venta
                cantidadItems: venta.detalles.reduce((acc, det) => acc + det.cantidad, 0)
            }))
        };
    }
}