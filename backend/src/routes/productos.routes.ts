import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
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
        return (req.query.negocioId || req.body?.negocioId) as string ?? null;
    }

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
            console.error('Error en GET /api/productos:', e);
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

            // ==========================================
            // 🟢 EMITIR EVENTO WEBSOCKET
            // ==========================================
            const io = req.app.get('io');
            if (io) {
                const productoCompleto = await prisma.producto.findUnique({
                    where: { id: nuevo.id },
                    include: {
                        negocio: { select: { nombre: true, slug: true } }
                    }
                });

                if (productoCompleto) {
                    // Firmamos la imagen específicamente para el socket
                    if (productoCompleto.imagenUrl) {
                        const filename = productoCompleto.imagenUrl.split('/').pop();
                        const firma = jwt.sign({ file: filename }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
                        productoCompleto.imagenUrl = `/api/productos/ver-imagen/${filename}?firma=${firma}`;
                    }

                    io.emit('nuevo_producto', productoCompleto);
                    console.log('📤 WebSocket: nuevo_producto emitido', productoCompleto.nombre);
                }
            }

            res.status(201).json(nuevo);
        } catch (e) {
            console.error(e);
            res.status(500).json({ mensaje: 'Error al crear producto' });
        }
    }
);

// ==========================================
// 🛡️ GET /api/productos/ver-imagen/:filename
// ==========================================
router.get('/ver-imagen/:filename', (req, res) => {
    const { filename } = req.params;
    const { firma } = req.query;

    if (!firma) {
        return res.status(403).json({ mensaje: 'Acceso denegado: Firma ausente' });
    }

    try {
        // Verificamos el token JWT de la imagen
        jwt.verify(firma as string, process.env.JWT_SECRET as string);

        // Resolvemos la ruta absoluta al archivo
        const filePath = path.resolve(__dirname, '../../uploads', filename);

        // Prevenir ataques de Path Traversal asegurando que esté en /uploads
        if (!filePath.startsWith(path.resolve(__dirname, '../../uploads'))) {
            return res.status(403).json({ mensaje: 'Ruta de archivo no permitida' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ mensaje: 'Imagen no encontrada en el servidor' });
        }

        // Entregamos el archivo
        res.sendFile(filePath);
    } catch (err) {
        return res.status(403).json({ mensaje: 'La firma de la imagen es inválida o ha expirado' });
    }
});

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