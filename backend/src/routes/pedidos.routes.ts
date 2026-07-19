import { Router } from 'express';
import { verificarRol, verificarToken, AuthRequest } from '../middlewares/auth.middleware';
import { PedidosService } from '../services/pedidos.service';
import { obtenerRespuestaError } from '../errors/app.error';

const router = Router();
const pedidosService = new PedidosService();

router.use(verificarToken, verificarRol(['CLIENTE']));

router.post('/', async (req: AuthRequest, res) => {
    try {
        const pedidos = await pedidosService.crearDesdeCarrito(req.socio.id, req.body.items);
        res.status(201).json(pedidos);
    } catch (error: unknown) {
        console.error('Error creando pedidos:', error);
        const respuesta = obtenerRespuestaError(error);
        res.status(respuesta.statusCode).json({ mensaje: respuesta.mensaje });
    }
});

router.get('/', async (req: AuthRequest, res) => {
    try {
        res.json(await pedidosService.listarDelCliente(req.socio.id));
    } catch (error: unknown) {
        console.error('Error consultando pedidos:', error);
        const respuesta = obtenerRespuestaError(error);
        res.status(respuesta.statusCode).json({ mensaje: respuesta.mensaje });
    }
});

router.delete('/:pedidoId', async (req: AuthRequest, res) => {
    try {
        res.json(await pedidosService.cancelar(String(req.params.pedidoId), req.socio.id));
    } catch (error: unknown) {
        console.error('Error cancelando pedido:', error);
        const respuesta = obtenerRespuestaError(error);
        res.status(respuesta.statusCode).json({ mensaje: respuesta.mensaje });
    }
});

export default router;
