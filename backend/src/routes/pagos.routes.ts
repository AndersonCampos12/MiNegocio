import { Router } from 'express';
import { Server } from 'socket.io';
import { AuthRequest, verificarRol, verificarToken } from '../middlewares/auth.middleware';
import { PagosService } from '../services/pagos.service';
import { obtenerRespuestaError } from '../errors/app.error';

export const pagosRoutesFactory = (io: Server) => {
    const router = Router();
    const pagosService = new PagosService(io);
    const soloCliente = [verificarToken, verificarRol(['CLIENTE'])];

    router.post('/:pedidoId/iniciar', ...soloCliente, async (req: AuthRequest, res) => {
        try {
            const proveedor = String(req.body.proveedor || '').toUpperCase();
            if (proveedor !== 'PAYPAL' && proveedor !== 'PAYPHONE') {
                return res.status(400).json({ mensaje: 'Proveedor de pago inválido.' });
            }
            res.json(await pagosService.iniciar(String(req.params.pedidoId), req.socio.id, proveedor));
        } catch (error: unknown) {
            console.error('Error iniciando pago:', error);
            const respuesta = obtenerRespuestaError(error);
            res.status(respuesta.statusCode).json({ mensaje: respuesta.mensaje });
        }
    });

    router.post('/paypal/:pedidoId/capturar', ...soloCliente, async (req: AuthRequest, res) => {
        try {
            const venta = await pagosService.confirmarPaypal(String(req.params.pedidoId), req.socio.id, String(req.body.orderId || ''));
            res.json({ pagado: true, venta });
        } catch (error: unknown) {
            console.error('Error confirmando pago PayPal:', error);
            const respuesta = obtenerRespuestaError(error);
            res.status(respuesta.statusCode).json({ mensaje: respuesta.mensaje });
        }
    });

    router.post('/payphone/:pedidoId/confirmar', ...soloCliente, async (req: AuthRequest, res) => {
        try {
            const venta = await pagosService.confirmarPayphone(
                String(req.params.pedidoId),
                Number(req.body.id),
                String(req.body.clientTransactionId || ''),
                req.socio.id
            );
            res.json({ pagado: true, venta });
        } catch (error: unknown) {
            console.error('Error confirmando pago PayPhone:', error);
            const respuesta = obtenerRespuestaError(error);
            res.status(respuesta.statusCode).json({ mensaje: respuesta.mensaje });
        }
    });

    router.post('/payphone/NotificacionPago', async (req, res) => {
        try {
            await pagosService.confirmarNotificacionPayphone(req.body);
            res.json({ Response: true, ErrorCode: '000' });
        } catch {
            res.status(400).json({ Response: false, ErrorCode: '222' });
        }
    });

    return router;
};
