import { Router } from 'express';
import { AuthRequest, verificarToken, verificarRol } from '../middlewares/auth.middleware';
import { prisma } from '../config/database';
import { RecomendacionesService } from '../services/recomendaciones.service';

const router = Router();
const service = new RecomendacionesService();

router.post(
    '/',
    verificarToken,
    verificarRol(['SUPERADMIN', 'ADMINISTRADOR', 'VENDEDOR', 'CAJERO']),
    async (req: AuthRequest, res) => {
        try {
            let negocioId = req.socio?.negocioId as string | undefined;

            if (!negocioId && req.socio?.rol === 'SUPERADMIN') {
                negocioId = req.body?.negocioId;
            }
            if (!negocioId && req.socio?.id) {
                const socio = await prisma.socio.findUnique({
                    where: { id: req.socio.id },
                    select: { negocioId: true }
                });
                negocioId = socio?.negocioId || undefined;
            }
            if (!negocioId) {
                return res.status(400).json({ mensaje: 'No se pudo determinar el negocio.' });
            }

            const diasSolicitados = Number(req.body?.dias || 30);
            const limiteSolicitado = Number(req.body?.limite || 5);
            const dias = Number.isInteger(diasSolicitados) ? Math.min(Math.max(diasSolicitados, 1), 365) : 30;
            const limite = Number.isInteger(limiteSolicitado) ? Math.min(Math.max(limiteSolicitado, 1), 10) : 5;

            const resultado = await service.obtener(negocioId, dias, limite);
            res.status(200).json(resultado);
        } catch (error) {
            console.error('Error al generar recomendaciones:', error);
            res.status(500).json({ mensaje: 'No se pudieron generar las recomendaciones.' });
        }
    }
);

export default router;
