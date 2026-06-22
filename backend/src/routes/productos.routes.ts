import { Router, Response } from 'express';
import { upload } from '../config/multer';
import { ProductosService } from '../services/productos.service';
import { prisma } from '../config/database';
import {
    verificarToken,
    verificarRol,
    AuthRequest
} from '../middlewares/auth.middleware';

const router = Router();
const svc = new ProductosService();

// Función helper: extrae el negocioId según el rol
async function resolverNegocioId(req: AuthRequest): Promise<string | null> {
    const { rol, id, negocioId } = req.socio;

    if (rol === 'SUPERADMIN') {
        // Usamos ?. para evitar el crash si req.body es undefined en peticiones GET
        return (req.query.negocioId || req.body?.negocioId) as string ?? null;
    }

    // Para el resto, usamos el negocioId que viene en su JWT
    return negocioId ?? null;
}

// GET /api/productos
router.get('/',
    verificarToken,
    verificarRol(['SUPERADMIN', 'ADMINISTRADOR', 'VENDEDOR', 'CAJERO']),
    async (req: AuthRequest, res: Response) => {
        try {
            const negocioId = await resolverNegocioId(req);
            if (!negocioId) {
                return res.status(400).json({ mensaje: 'Falta el negocioId. El SUPERADMIN debe enviarlo como ?negocioId=...' });
            }
            const productos = await svc.obtenerProductos(negocioId);
            res.json(productos);
        } catch (e) {
            console.error('Error en GET /api/productos:', e); // <-- ¡AQUÍ ESTÁ LA CLAVE!
            res.status(500).json({ mensaje: 'Error al obtener productos' });
        }
    }
);

// POST /api/productos
router.post('/',
    verificarToken,
    verificarRol(['SUPERADMIN', 'ADMINISTRADOR']),
    upload.single('imagen'),
    async (req: AuthRequest, res: Response) => {
        try {
            const negocioId = await resolverNegocioId(req);
            if (!negocioId) {
                return res.status(400).json({ mensaje: 'negocioId requerido' });
            }
            const { nombre, valor, stock, descripcion } = req.body;
            const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

            const nuevo = await svc.crearProducto(negocioId, {
                nombre,
                valor: parseFloat(valor),
                stock: parseInt(stock, 10),
                descripcion,
                imagenUrl
            });
            res.status(201).json(nuevo);
        } catch (e) {
            console.error(e);
            res.status(500).json({ mensaje: 'Error al crear producto' });
        }
    }
);

// PUT /api/productos/:id
router.put('/:id',
    verificarToken,
    verificarRol(['SUPERADMIN', 'ADMINISTRADOR']),
    async (req: AuthRequest, res: Response) => {
        try {
            const id = req.params.id as string;
            const actualizado = await svc.actualizarProducto(id, req.body);
            res.json(actualizado);
        } catch (e) {
            res.status(500).json({ mensaje: 'Error al actualizar' });
        }
    }
);

// DELETE /api/productos/:id
router.delete('/:id',
    verificarToken,
    verificarRol(['SUPERADMIN', 'ADMINISTRADOR']),
    async (req: AuthRequest, res: Response) => {
        try {
            const id = req.params.id as string;
            await svc.desactivarProducto(id);
            res.json({ mensaje: 'Producto descontinuado' });
        } catch (e) {
            res.status(500).json({ mensaje: 'Error al eliminar' });
        }
    }
);

export default router;