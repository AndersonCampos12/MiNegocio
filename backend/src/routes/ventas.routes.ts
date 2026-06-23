import { Router } from 'express';
import { Server } from 'socket.io';
import { VentasService } from '../services/ventas.service';
import { verificarToken, verificarRol, AuthRequest } from '../middlewares/auth.middleware';

export const ventasRoutesFactory = (io: Server) => {
    const router = Router();
    const ventasService = new VentasService();

    router.post('/',
        verificarToken,
        verificarRol(['SUPERADMIN', 'ADMINISTRADOR', 'VENDEDOR', 'CAJERO']),
        async (req: AuthRequest, res) => {
            try {
                const socioId = req.socio?.id;
                const negocioId = req.socio?.negocioId;

                // 1. Extraemos los nuevos campos que envía la caja (Angular)
                const { detalles, clienteId, metodoPago } = req.body;

                if (!negocioId) {
                    return res.status(400).json({
                        mensaje: 'Este usuario no tiene un negocio asignado.'
                    });
                }

                if (!clienteId || !metodoPago) {
                    return res.status(400).json({
                        mensaje: 'Faltan datos de facturación (Cliente o Método de pago).'
                    });
                }

                // 2. Pasamos el objeto completo al servicio
                const venta = await ventasService.registrarVenta(
                    { socioId, negocioId, clienteId, metodoPago, detalles },
                    io
                );

                // 3. 🚨 IMPORTANTE: Retornamos el objeto `venta` directamente 
                // para que Angular pueda leer `resultadoVenta.id` e imprimir la factura
                res.status(201).json(venta);
            } catch (error: any) {
                res.status(400).json({ mensaje: error.message });
            }
        }
    );

    return router;
};