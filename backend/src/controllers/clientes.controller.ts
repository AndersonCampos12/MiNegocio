import { Response } from 'express';
import { ClientesService } from '../services/clientes.service';
import { AppError } from '../errors/app.error';
import { AuthRequest } from '../middlewares/auth.middleware';

const clientesService = new ClientesService();

const obtenerNegocioId = (req: AuthRequest): string | null => {
    if (req.socio?.rol === 'SUPERADMIN') {
        return String(req.query.negocioId || req.body?.negocioId || '') || null;
    }
    return req.socio?.negocioId || null;
};

export const buscarClientesCtrl = async (req: AuthRequest, res: Response) => {
    try {
        const search = String(req.query.search || '').trim();
        const negocioId = obtenerNegocioId(req);
        if (search.length < 2 || !negocioId) {
            return res.status(400).json({ mensaje: 'La búsqueda y la empresa son obligatorias.' });
        }
        return res.json(await clientesService.buscarClientes(search, negocioId));
    } catch (error: any) {
        return res.status(500).json({ mensaje: error.message || 'No fue posible buscar clientes.' });
    }
};

export const crearClienteCtrl = async (req: AuthRequest, res: Response) => {
    try {
        const negocioId = obtenerNegocioId(req);
        if (!negocioId) return res.status(400).json({ mensaje: 'No se pudo determinar la empresa actual.' });

        const resultado = await clientesService.crearOVincularCliente(req.body, negocioId);
        return res.status(resultado.identidadCreada ? 201 : 200).json({
            mensaje: resultado.identidadCreada
                ? 'Cliente registrado correctamente.'
                : 'Cliente agregado correctamente a este negocio.',
            cliente: resultado.cliente
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ mensaje: error.message });
        }
        return res.status(500).json({ mensaje: 'No fue posible registrar el cliente. Inténtalo nuevamente.' });
    }
};

export const obtenerClientesCtrl = async (req: AuthRequest, res: Response) => {
    try {
        const negocioId = obtenerNegocioId(req);
        if (!negocioId) return res.status(400).json({ mensaje: 'No se pudo determinar la empresa actual.' });
        const estado = String(req.query.estado || 'activos');
        const activo = estado === 'todos' ? undefined : estado !== 'inactivos';
        return res.json(await clientesService.obtenerClientes(negocioId, activo));
    } catch (error: any) {
        return res.status(500).json({ mensaje: error.message || 'No fue posible cargar los clientes.' });
    }
};

export const actualizarClienteCtrl = async (req: AuthRequest, res: Response) => {
    try {
        const negocioId = obtenerNegocioId(req);
        if (!negocioId) return res.status(400).json({ mensaje: 'No se pudo determinar la empresa actual.' });
        await clientesService.actualizarContacto(String(req.params.id), req.body, negocioId);
        return res.json({ mensaje: 'Datos de contacto actualizados correctamente.' });
    } catch (error: any) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ mensaje: error.message });
        return res.status(500).json({ mensaje: 'No fue posible actualizar el cliente.' });
    }
};

export const cambiarEstadoClienteCtrl = async (req: AuthRequest, res: Response) => {
    try {
        const negocioId = obtenerNegocioId(req);
        if (!negocioId) return res.status(400).json({ mensaje: 'No se pudo determinar la empresa actual.' });
        if (typeof req.body?.activo !== 'boolean') return res.status(400).json({ mensaje: 'El estado indicado no es válido.' });
        await clientesService.cambiarEstado(String(req.params.id), req.body.activo, negocioId);
        return res.json({ mensaje: req.body.activo ? 'Cliente reactivado correctamente.' : 'Cliente desactivado correctamente.' });
    } catch (error: any) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ mensaje: error.message });
        return res.status(500).json({ mensaje: 'No fue posible cambiar el estado del cliente.' });
    }
};
