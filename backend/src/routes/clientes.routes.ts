import { Router } from 'express';
import { actualizarClienteCtrl, buscarClientesCtrl, cambiarEstadoClienteCtrl, crearClienteCtrl, obtenerClientesCtrl } from '../controllers/clientes.controller';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', verificarToken, verificarRol(['SUPERADMIN', 'ADMINISTRADOR']), obtenerClientesCtrl);
router.get('/buscar', verificarToken, verificarRol(['SUPERADMIN', 'ADMINISTRADOR', 'VENDEDOR', 'CAJERO']), buscarClientesCtrl);
router.post('/', verificarToken, verificarRol(['SUPERADMIN', 'ADMINISTRADOR', 'VENDEDOR', 'CAJERO']), crearClienteCtrl);
router.put('/:id', verificarToken, verificarRol(['SUPERADMIN', 'ADMINISTRADOR']), actualizarClienteCtrl);
router.patch('/:id/estado', verificarToken, verificarRol(['SUPERADMIN', 'ADMINISTRADOR']), cambiarEstadoClienteCtrl);

export default router;
