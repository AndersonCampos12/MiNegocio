import { Router } from 'express';
import { ReportesService } from '../services/reportes.service';
import { prisma } from '../config/database';
import { generarHtmlFactura } from '../templates/factura.template';
import { PdfService } from '../services/pdf.service';
import { CorreoService } from '../services/correo.service';
import { obtenerRespuestaError } from '../errors/app.error';
import { AuthRequest, verificarRol, verificarToken } from '../middlewares/auth.middleware';

const router = Router();
const reportesService = new ReportesService();
const pdfService = new PdfService();
const correoService = new CorreoService();

const aplicarContactoDelNegocio = async (venta: any) => {
    if (!venta?.clienteId || !venta?.negocioId || !venta.cliente) return venta;

    const relacion = await prisma.clienteNegocio.findUnique({
        where: {
            clienteId_negocioId: {
                clienteId: venta.clienteId,
                negocioId: venta.negocioId
            }
        },
        select: { nombreReferencia: true, emailContacto: true }
    });

    return {
        ...venta,
        cliente: {
            ...venta.cliente,
            nombre: relacion?.nombreReferencia || venta.cliente.nombre,
            email: relacion?.emailContacto || venta.cliente.email
        }
    };
};

router.get('/', verificarToken, verificarRol(['SUPERADMIN', 'ADMINISTRADOR']), async (req: AuthRequest, res) => {
    try {
        const socio = await prisma.socio.findUnique({
            where: { id: req.socio.id },
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

        const ventaEncontrada = await prisma.venta.findUnique({
            where: { id },
            include: {
                cliente: true,
                socio: true, // Para obtener el vendedor
                detalles: {
                    include: { producto: true }
                }
            }
        });

        if (!ventaEncontrada) {
            return res.status(404).send('Factura no encontrada');
        }
        const venta = await aplicarContactoDelNegocio(ventaEncontrada);

        const autoImprimir = req.query.autoImprimir !== 'false';
        const estiloModerno = req.query.estilo === 'moderno';
        const htmlFactura = generarHtmlFactura(venta, { autoImprimir, estiloModerno });

        res.send(htmlFactura);
    } catch (error) {
        console.error('Error al generar factura:', error);
        res.status(500).send('Error interno al generar vista de impresión');
    }
});

router.get('/factura/:id/pdf', async (req, res) => {
    try {
        const { id } = req.params;

        const ventaEncontrada = await prisma.venta.findUnique({
            where: { id },
            include: {
                cliente: true,
                socio: true,
                detalles: {
                    include: { producto: true }
                }
            }
        });

        if (!ventaEncontrada) {
            return res.status(404).send('Factura no encontrada');
        }
        const venta = await aplicarContactoDelNegocio(ventaEncontrada);

        const estiloModerno = req.query.estilo === 'moderno';
        const htmlFactura = generarHtmlFactura(venta, {
            autoImprimir: false,
            estiloModerno
        });
        const pdfFactura = await pdfService.generarDesdeHtml(htmlFactura);
        const numeroFactura = venta.id.split('-')[0].toUpperCase();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="factura-${numeroFactura}.pdf"`
        );
        res.send(pdfFactura);
    } catch (error) {
        console.error('Error al generar PDF de factura:', error);
        res.status(500).send('Error interno al generar PDF de factura');
    }
});

router.post('/factura/:id/enviar', async (req, res) => {
    try {
        const { id } = req.params;

        const ventaEncontrada = await prisma.venta.findUnique({
            where: { id },
            include: {
                cliente: true,
                socio: true,
                detalles: {
                    include: { producto: true }
                }
            }
        });

        if (!ventaEncontrada) {
            return res.status(404).json({ mensaje: 'Factura no encontrada' });
        }
        const venta = await aplicarContactoDelNegocio(ventaEncontrada);

        if (!venta.cliente?.email) {
            return res.status(400).json({
                mensaje: 'El cliente no tiene un correo electrónico registrado'
            });
        }

        const numeroFactura = venta.id.split('-')[0].toUpperCase();
        const htmlFactura = generarHtmlFactura(venta, {
            autoImprimir: false,
            estiloModerno: true
        });
        const pdfFactura = await pdfService.generarDesdeHtml(htmlFactura);
        const idCorreo = await correoService.enviar({
            destinatario: venta.cliente.email,
            asunto: `Factura #${numeroFactura}`,
            tipo: 'FACTURA',
            html: `
                <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; max-width: 560px; margin: 0 auto;">
                    <h2 style="color: #0f172a; margin-bottom: 8px;">Gracias por tu compra</h2>
                    <p style="margin-top: 0;">Hola, <strong>${venta.cliente.nombre}</strong>.</p>
                    <p>Tu compra fue procesada correctamente. Encontrarás la factura
                        <strong>#${numeroFactura}</strong> adjunta a este correo en formato PDF.</p>
                    <p style="font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
                        Este es un mensaje automático. Gracias por preferirnos.
                    </p>
                </div>
            `,
            adjuntos: [{
                nombre: `factura-${numeroFactura}.pdf`,
                contenido: pdfFactura
            }]
        });

        res.status(200).json({
            mensaje: 'Factura enviada correctamente',
            idCorreo
        });
    } catch (error: unknown) {
        console.error('Error al enviar factura por correo:', error);
        const respuesta = obtenerRespuestaError(error);
        res.status(respuesta.statusCode).json({ mensaje: respuesta.mensaje });
    }
});

export default router;
