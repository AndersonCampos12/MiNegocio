import { Router } from 'express';
import { Server } from 'socket.io';
import { VentasService } from '../services/ventas.service';
import { verificarToken, AuthRequest } from '../middlewares/auth.middleware';

export const ventasRoutesFactory = (io: Server) => {
    const router = Router();
    const ventasService = new VentasService();

    // Esta ruta usa el middleware para asegurar que solo usuarios con token puedan vender
    router.post('/', verificarToken, async (req: AuthRequest, res) => {
        try {
            // Extraemos el ID del socio desde el token JWT validado
            const socioId = (req.socio as any)?.id;
            const { detalles } = req.body;

            const venta = await ventasService.registrarVenta({ socioId, detalles }, io);
            res.status(201).json({ mensaje: 'Venta registrada con éxito', venta });
        } catch (error: any) {
            // Devuelve 400 si hay error de stock (cumpliendo con la captura de excepciones del informe)
            res.status(400).json({ mensaje: error.message });
        }
    });

    return router;
};