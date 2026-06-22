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

export default router;