import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Extendemos la interfaz Request para poder inyectar los datos del socio autenticado
export interface AuthRequest extends Request {
    socio?: string | JwtPayload;
}

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        res.status(401).json({ mensaje: 'Token requerido' });
        return;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        req.socio = payload;
        next();
    } catch (error) {
        res.status(403).json({ mensaje: 'Token inválido o expirado' });
    }
};