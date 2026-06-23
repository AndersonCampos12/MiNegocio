import { Router } from 'express';
import { ReportesService } from '../services/reportes.service';
import { prisma } from '../config/database';

const router = Router();
const reportesService = new ReportesService();

router.get('/', async (req, res) => {
    try {
        const socioId = req.query.socioId as string;
        if (!socioId) return res.status(400).json({ mensaje: 'Falta ID de socio' });

        const socio = await prisma.socio.findUnique({
            where: { id: socioId },
            select: { negocioId: true }
        });

        if (!socio) return res.status(404).json({ mensaje: 'Socio no encontrado' });

        // ==========================================
        // EL GUARDIA DE SEGURIDAD (Solución TS2345)
        // ==========================================
        if (!socio.negocioId) {
            return res.status(403).json({
                mensaje: 'Acceso denegado. Este usuario no tiene una empresa asignada y no posee métricas.'
            });
        }

        // Ahora TypeScript sabe que negocioId es un string 100% real
        const metricas = await reportesService.obtenerMetricas(socio.negocioId);
        res.status(200).json(metricas);
    } catch (error) {
        console.error('Error al generar reportes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

router.get('/factura/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const venta = await prisma.venta.findUnique({
            where: { id },
            include: {
                cliente: true,
                socio: true, // Para obtener el vendedor
                detalles: {
                    include: { producto: true }
                }
            }
        });

        if (!venta) {
            return res.status(404).send('Factura no encontrada');
        }

        // Estructura HTML autoejecutable para imprimir directamente en formato POS (ticket térmico)
        const htmlFactura = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Ticket #${venta.id.split('-')[0]}</title>
            <style>
                body { 
                    font-family: 'Courier New', Courier, monospace; 
                    width: 300px; /* Ancho estándar de ticketera térmica de 80mm */
                    margin: 0 auto; 
                    padding: 10px;
                    font-size: 12px; 
                    color: #000;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .linea { border-bottom: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { padding: 4px 0; }
                .bold { font-weight: bold; }
            </style>
        </head>
        <body>
            <h2 class="text-center" style="margin-bottom: 5px;">TU NEGOCIO</h2>
            <p class="text-center" style="margin-top: 0; font-size: 10px;">Comprobante de Venta</p>
            
            <div class="linea"></div>
            
            <p><span class="bold">Ticket:</span> ${venta.id.split('-')[0].toUpperCase()}</p>
            <p><span class="bold">Fecha:</span> ${new Date(venta.creadoEn).toLocaleString()}</p>
            <p><span class="bold">Cliente:</span> ${venta.cliente?.nombre || 'Consumidor Final'}</p>
            <p><span class="bold">Cajero:</span> ${venta.socio?.nombre || 'Caja Principal'}</p>
            <p><span class="bold">Método:</span> ${venta.metodoPago}</p>
            
            <div class="linea"></div>
            
            <table>
                <thead>
                    <tr style="border-bottom: 1px solid #000;">
                        <th class="text-left">Cant</th>
                        <th class="text-left">Descripción</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${venta.detalles.map(d => `
                        <tr>
                            <td class="text-left" style="vertical-align: top;">${d.cantidad}</td>
                            <td class="text-left" style="padding-right: 5px;">${d.producto.nombre}</td>
                            <td class="text-right" style="vertical-align: top;">$${(d.cantidad * Number(d.precioUnit)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="linea"></div>
            
            <table style="font-size: 13px;">
                <tr>
                    <td class="text-right">Subtotal:</td>
                    <td class="text-right">$${Number(venta.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                    <td class="text-right">IVA (15%):</td>
                    <td class="text-right">$${Number(venta.impuestos).toFixed(2)}</td>
                </tr>
                <tr class="bold" style="font-size: 15px;">
                    <td class="text-right" style="padding-top: 8px;">TOTAL:</td>
                    <td class="text-right" style="padding-top: 8px;">$${Number(venta.total).toFixed(2)}</td>
                </tr>
            </table>
            
            <div class="linea" style="margin-top: 15px;"></div>
            <p class="text-center bold">¡Gracias por su compra!</p>
            
            <script>
                // Dispara el diálogo de impresión automáticamente y cierra la pestaña al terminar
                window.onload = function() { 
                    window.print();
                    // Opcional: descomenta la siguiente línea si quieres que la pestaña se cierre sola
                    // window.onafterprint = function() { window.close(); }
                }
            </script>
        </body>
        </html>
        `;

        res.send(htmlFactura);
    } catch (error) {
        console.error('Error al generar factura:', error);
        res.status(500).send('Error interno al generar vista de impresión');
    }
});

export default router;