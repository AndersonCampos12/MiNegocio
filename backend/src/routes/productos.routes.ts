import { Router } from 'express';
import { ProductosService } from '../services/productos.service';
import { verificarToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const productosService = new ProductosService();

// Crear un producto nuevo (Ruta protegida)
router.post('/', verificarToken, async (req: AuthRequest, res) => {
    try {
        const socioId = (req.socio as any)?.id;
        const producto = await productosService.crearProducto(socioId, req.body);
        res.status(201).json({ mensaje: 'Producto creado', producto });
    } catch (error: any) {
        res.status(400).json({ mensaje: error.message });
    }
});

// Obtener el inventario del negocio (Ruta protegida)
router.get('/', verificarToken, async (req: AuthRequest, res) => {
    try {
        const negocioId = (req.socio as any)?.negocioId;
        const productos = await productosService.obtenerInventario(negocioId);
        res.status(200).json(productos);
    } catch (error: any) {
        res.status(400).json({ mensaje: error.message });
    }
});

export default router;