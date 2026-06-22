import { Router, Response } from 'express';
import { UsuariosService } from '../services/usuarios.service';
import {
    verificarToken,
    verificarRol,
    AuthRequest
} from '../middlewares/auth.middleware';

const router = Router();
const svc = new UsuariosService();

// GET /api/usuarios - Listar usuarios
router.get('/',
    verificarToken,
    verificarRol(['SUPERADMIN', 'ADMINISTRADOR']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { rol, negocioId } = req.socio;
            // Pasamos el rol y el negocioId del token para aislar los datos
            const usuarios = await svc.obtenerUsuarios(rol, negocioId);
            res.json(usuarios);
        } catch (e) {
            console.error('Error en GET /api/usuarios:', e);
            res.status(500).json({ mensaje: 'Error al obtener usuarios' });
        }
    }
);

// POST /api/usuarios - Crear un usuario nuevo
router.post('/',
    verificarToken,
    verificarRol(['SUPERADMIN', 'ADMINISTRADOR']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { rol, negocioId } = req.socio;
            const data = req.body;

            if (!data.nombre || !data.email || !data.password || !data.rol) {
                return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
            }

            const nuevoUsuario = await svc.crearUsuario(rol, data, negocioId);
            const { password, ...usuarioSeguro } = nuevoUsuario;
            res.status(201).json(usuarioSeguro);

        } catch (e: any) {
            console.error('Error en POST /api/usuarios:', e);

            // Manejo de errores amigables de Prisma
            if (e.code === 'P2002') {
                return res.status(400).json({ mensaje: 'Este correo electrónico ya está registrado en el sistema.' });
            }
            if (e.code === 'P2003') {
                return res.status(400).json({ mensaje: 'La empresa asignada no existe o fue eliminada.' });
            }

            res.status(500).json({ mensaje: 'Ocurrió un error interno al crear el usuario.' });
        }
    }
);

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id',
    verificarToken,
    verificarRol(['SUPERADMIN', 'ADMINISTRADOR']),
    async (req: AuthRequest, res: Response) => {
        try {
            const id = req.params.id as string;
            // Aquí podríamos agregar una validación extra para que un ADMINISTRADOR
            // no pueda editar a un usuario que no sea de su negocioId.
            const actualizado = await svc.actualizarUsuario(id, req.body);

            const { password, ...usuarioSeguro } = actualizado;
            res.json(usuarioSeguro);
        } catch (e) {
            console.error('Error en PUT /api/usuarios:', e);
            res.status(500).json({ mensaje: 'Error al actualizar usuario' });
        }
    }
);

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete('/:id',
    verificarToken,
    verificarRol(['SUPERADMIN', 'ADMINISTRADOR']),
    async (req: AuthRequest, res: Response) => {
        try {
            const id = req.params.id as string;
            // IMPORTANTE: Como tu esquema no tiene "activo", usamos eliminación física.
            // Asegúrate de modificar el servicio a prisma.socio.delete({ where: { id } })
            await svc.eliminarUsuario(id);
            res.json({ mensaje: 'Usuario eliminado correctamente' });
        } catch (e) {
            console.error('Error en DELETE /api/usuarios:', e);
            res.status(500).json({ mensaje: 'Error al eliminar usuario' });
        }
    }
);

export default router;