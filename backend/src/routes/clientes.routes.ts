import { Router } from 'express';
import { buscarClientesCtrl, crearClienteCtrl } from '../controllers/clientes.controller';

const router = Router();

router.get('/buscar', buscarClientesCtrl);
router.post('/', crearClienteCtrl);

export default router;