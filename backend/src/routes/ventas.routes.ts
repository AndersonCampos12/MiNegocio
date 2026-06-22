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
                const { detalles } = req.body;

                if (!negocioId) {
                    return res.status(400).json({
                        mensaje: 'Este usuario no tiene un negocio asignado.'
                    });
                }

                const venta = await ventasService.registrarVenta(
                    { socioId, negocioId, detalles },
                    io
                );
                res.status(201).json({ mensaje: 'Venta registrada con éxito', venta });
            } catch (error: any) {
                res.status(400).json({ mensaje: error.message });
            }
        }
    );

    return router;
};