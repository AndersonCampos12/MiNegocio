import { Request, Response } from 'express';
import { ClientesService } from '../services/clientes.service';
import { AppError } from '../errors/app.error';

const clientesService = new ClientesService();

export const buscarClientesCtrl = async (req: Request, res: Response) => {
    try {
        const { search, negocioId } = req.query;
        if (!search || !negocioId) {
            return res.status(400).json({ mensaje: 'Faltan parámetros requeridos.' });
        }
        const clientes = await clientesService.buscarClientes(String(search), String(negocioId));
        return res.json(clientes);
    } catch (error: any) {
        return res.status(500).json({ mensaje: error.message });
    }
};

export const crearClienteCtrl = async (req: Request, res: Response) => {
    try {
        const nuevoCliente = await clientesService.crearCliente(req.body);
        return res.status(201).json(nuevoCliente);
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ mensaje: error.message });
        }
        console.error('Error inesperado al crear cliente:', error);
        return res.status(500).json({ mensaje: 'No fue posible registrar el cliente. Inténtalo nuevamente.' });
    }
};
