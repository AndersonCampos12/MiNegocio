import { Router, Response } from 'express';
import { verificarToken, verificarRol, AuthRequest } from '../middlewares/auth.middleware';
import { crearNegocioConAdmin } from '../services/negocios.service';
import { prisma } from '../config/database';
import multer from 'multer';
import { PocketBaseStorageService } from '../services/pocketbase-storage.service';

const router = Router();
const storage = new PocketBaseStorageService();
const subirLogo = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        const permitido = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
        permitido ? cb(null, true) : cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'logo'));
    }
});

// ==========================================
// EXCLUSIVO SUPERADMIN
// ==========================================
router.post('/crear-empresa', verificarToken, verificarRol(['SUPERADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { nombreNegocio, slug, plan, estado, nombreAdmin, cedulaAdmin, emailAdmin, passwordAdmin } = req.body;
        if (!nombreNegocio?.trim() || !slug?.trim() || !nombreAdmin?.trim() || !cedulaAdmin?.trim() || !emailAdmin?.trim() || !passwordAdmin) {
            res.status(400).json({ mensaje: 'Completa todos los datos de la empresa y su administrador.' });
            return;
        }
        if (!/^\d{10}$/.test(cedulaAdmin.trim())) {
            res.status(400).json({ mensaje: 'La cédula del administrador debe tener 10 dígitos.' });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAdmin.trim())) {
            res.status(400).json({ mensaje: 'El correo electrónico del administrador no es válido.' });
            return;
        }
        if (passwordAdmin.length < 8) {
            res.status(400).json({ mensaje: 'La contraseña del administrador debe tener al menos 8 caracteres.' });
            return;
        }
        if (plan && !['BASIC', 'PRO', 'MULTI', 'ILIMITADO'].includes(plan)) {
            res.status(400).json({ mensaje: 'El plan seleccionado no es válido.' });
            return;
        }
        if (estado && !['PENDIENTE', 'ACTIVO', 'BLOQUEADO'].includes(estado)) {
            res.status(400).json({ mensaje: 'El estado seleccionado no es válido.' });
            return;
        }
        const resultado = await crearNegocioConAdmin(req.body);
        const { password, ...adminSinPassword } = resultado.admin;

        res.status(201).json({
            mensaje: 'Empresa y Administrador creados con éxito',
            negocio: resultado.negocio,
            admin: adminSinPassword
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            const restriccion = (Array.isArray(error.meta?.target) ? error.meta.target.join(' ') : String(error.meta?.target ?? '')).toLowerCase();
            const campo = restriccion.includes('cedula') ? 'cédula' : restriccion.includes('email') ? 'correo electrónico' : restriccion.includes('slug') ? 'slug' : 'dato ingresado';
            res.status(400).json({ mensaje: `El ${campo} ya está en uso.` });
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

router.post('/:id/logo', verificarToken, verificarRol(['SUPERADMIN', 'ADMINISTRADOR']), subirLogo.single('logo'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        if (req.socio?.rol === 'ADMINISTRADOR' && id !== req.socio?.negocioId) {
            res.status(403).json({ mensaje: 'No puedes modificar el logo de otra empresa.' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ mensaje: 'Selecciona una imagen para el logo.' });
            return;
        }

        const negocioActual = await prisma.negocio.findUnique({ where: { id } });
        if (!negocioActual) {
            res.status(404).json({ mensaje: 'Empresa no encontrada.' });
            return;
        }
        const logo = await storage.guardarLogo(id, req.file, negocioActual.logoStorageId);
        const negocio = await prisma.negocio.update({
            where: { id },
            data: { logoUrl: logo.url, logoStorageId: logo.registroId }
        });
        res.json({ mensaje: 'Logo actualizado correctamente.', negocio });
    } catch (error: any) {
        console.error('Error al guardar logo en PocketBase:', error);
        const configuracion = error?.message === 'POCKETBASE_NOT_CONFIGURED';
        res.status(configuracion ? 503 : 502).json({
            mensaje: configuracion
                ? 'El almacenamiento de logos no está configurado.'
                : 'No fue posible guardar el logo en el almacenamiento.'
        });
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

        if (!nombre?.trim() || !slug?.trim()) {
            res.status(400).json({ mensaje: 'El nombre y el slug de la empresa son obligatorios.' });
            return;
        }

        const datosActualizacion: any = { nombre: nombre.trim(), slug: slug.trim().toLowerCase() };

        // Solo el Superadmin puede cambiar planes y estados
        if (rol === 'SUPERADMIN') {
            if (plan && !['BASIC', 'PRO', 'MULTI', 'ILIMITADO'].includes(plan)) {
                res.status(400).json({ mensaje: 'El plan seleccionado no es válido.' });
                return;
            }
            if (estado && !['PENDIENTE', 'ACTIVO', 'BLOQUEADO'].includes(estado)) {
                res.status(400).json({ mensaje: 'El estado seleccionado no es válido.' });
                return;
            }
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
