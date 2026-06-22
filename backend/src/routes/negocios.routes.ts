import { Router, Response } from 'express';
import { verificarToken, verificarRol, AuthRequest } from '../middlewares/auth.middleware';
import { crearNegocioConAdmin } from '../services/negocios.service';
import { prisma } from '../config/database'; // <-- ESTA ES LA LÍNEA QUE TE FALTA

const router = Router();

// Ruta EXCLUSIVA para SUPERADMIN
router.post('/crear-empresa', verificarToken, verificarRol(['SUPERADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const resultado = await crearNegocioConAdmin(req.body);

        // Evitamos devolver el password hasheado en la respuesta
        const { password, ...adminSinPassword } = resultado.admin;

        res.status(201).json({
            mensaje: 'Empresa y Administrador creados con éxito',
            negocio: resultado.negocio,
            admin: adminSinPassword
        });
    } catch (error: any) {
        // Manejo de error si el email o el slug ya existen (Unique constraint en Prisma)
        if (error.code === 'P2002') {
            res.status(400).json({ mensaje: 'El email o el slug (identificador) ya están en uso.' });
            return;
        }
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
});

router.get('/',
    verificarToken,
    verificarRol(['SUPERADMIN']),
    async (req, res: Response) => {
        try {
            const negocios = await prisma.negocio.findMany({
                where: { estado: 'ACTIVO' }, // O quita el where si quieres ver los PENDIENTES
                orderBy: { creadoEn: 'desc' }
            });
            res.json(negocios);
        } catch (error) {
            res.status(500).json({ mensaje: 'Error al obtener empresas' });
        }
    }
);

export default router;