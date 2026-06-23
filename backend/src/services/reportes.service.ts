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
                detalles: true, // Incluimos esto para saber cuántos items compraron
                socio: {        // 👤 NUEVO: Incluimos la relación del vendedor/cajero
                    select: {
                        nombre: true
                    }
                }
            }
        });

        // 4. Empaquetamos todo y lo mandamos listo al Frontend
        return {
            ingresosTotales: agregaciones._sum.total || 0,
            totalVentas: agregaciones._count.id || 0,
            alertasStock: productosBajoStock,

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