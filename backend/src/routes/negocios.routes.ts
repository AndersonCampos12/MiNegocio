import { Router, Response } from 'express';
import { verificarToken, verificarRol, AuthRequest } from '../middlewares/auth.middleware';
import { crearNegocioConAdmin } from '../services/negocios.service';
import { prisma } from '../config/database';

const router = Router();

// ==========================================
// EXCLUSIVO SUPERADMIN
// ==========================================
router.post('/crear-empresa', verificarToken, verificarRol(['SUPERADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const resultado = await crearNegocioConAdmin(req.body);
        const { password, ...adminSinPassword } = resultado.admin;

        res.status(201).json({
            mensaje: 'Empresa y Administrador creados con éxito',
            negocio: resultado.negocio,
            admin: adminSinPassword
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(400).json({ mensaje: 'El email o el slug (identificador) ya están en uso.' });
            return;
        }
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
});

router.get('/', verificarToken, verificarRol(['SUPERADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        // Quitamos el filtro de estado para que el Superadmin vea todas (incluso las bloqueadas)
        const negocios = await prisma.negocio.findMany({
            orderBy: { creadoEn: 'desc' }
        });
        res.json(negocios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener empresas' });
    }
});

// ==========================================
// PARA ADMINISTRADORES Y SUPERADMIN
// ==========================================
router.get('/mi-empresa', verificarToken, verificarRol(['ADMINISTRADOR']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const negocioId = req.socio?.negocioId;
        if (!negocioId) {
            res.status(400).json({ mensaje: 'No tienes una empresa asignada' });
            return;
        }

        const negocio = await prisma.negocio.findUnique({
            where: { id: negocioId }
        });
        res.json(negocio);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los datos de la empresa' });
    }
});

router.put('/:id', verificarToken, verificarRol(['SUPERADMIN', 'ADMINISTRADOR']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nombre, slug, plan, estado } = req.body;
        const rol = req.socio?.rol;
        const socioNegocioId = req.socio?.negocioId;

        if (rol === 'ADMINISTRADOR' && id !== socioNegocioId) {
            res.status(403).json({ mensaje: 'Acceso denegado: No puedes editar una empresa ajena.' });
            return;
        }

        const datosActualizacion: any = { nombre, slug };

        // Solo el Superadmin puede cambiar planes y estados
        if (rol === 'SUPERADMIN') {
            if (plan) datosActualizacion.plan = plan;
            if (estado) datosActualizacion.estado = estado;
        }

        const negocioActualizado = await prisma.negocio.update({
            where: { id: String(id) }, // <-- Forzamos el tipo a String
            data: datosActualizacion
        });

        res.json({ mensaje: 'Empresa actualizada', negocio: negocioActualizado });
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(400).json({ mensaje: 'El slug ya está en uso por otra empresa.' });
            return;
        }
        res.status(500).json({ mensaje: 'Error al actualizar la empresa' });
    }
});

export default router;