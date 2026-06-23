import { Router, Request, Response } from 'express';
import { TiendaService } from '../services/tienda.service';

const router = Router();
const tiendaService = new TiendaService();

// GET /api/tienda/productos - PÚBLICO (sin autenticación)
router.get('/productos', async (req: Request, res: Response) => {
    try {
        const slug = req.query.negocio as string | undefined;
        const productos = await tiendaService.obtenerProductosTienda(slug);
        res.json(productos);
    } catch (error) {
        console.error('Error en GET /api/tienda/productos:', error);
        res.status(500).json({ mensaje: 'Error al obtener productos de la tienda' });
    }
});

// GET /api/tienda/negocios - Lista de negocios activos para el filtro
router.get('/negocios', async (req: Request, res: Response) => {
    try {
        const negocios = await tiendaService.obtenerNegociosActivos();
        res.json(negocios);
    } catch (error) {
        console.error('Error en GET /api/tienda/negocios:', error);
        res.status(500).json({ mensaje: 'Error al obtener negocios' });
    }
});

export default router;