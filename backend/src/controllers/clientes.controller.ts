import { Request, Response } from 'express';
import { ClientesService } from '../services/clientes.service';

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
        // Retornamos 400 (Bad Request) con el mensaje exacto controlado en el servicio
        return res.status(400).json({ mensaje: error.message });
    }
};