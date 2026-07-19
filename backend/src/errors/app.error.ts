import { Prisma } from '@prisma/client';

export class AppError extends Error {
    public readonly statusCode: number;

    constructor(mensaje: string, statusCode = 400) {
        super(mensaje);
        this.statusCode = statusCode;
        // Aquí está la corrección: new.target en minúsculas
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export function obtenerRespuestaError(error: unknown): { statusCode: number; mensaje: string } {
    if (error instanceof AppError) {
        return { statusCode: error.statusCode, mensaje: error.message };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2021') {
            return {
                statusCode: 503,
                mensaje: 'El módulo de pedidos todavía no está habilitado en la base de datos.'
            };
        }
        if (error.code === 'P2022') {
            return {
                statusCode: 503,
                mensaje: 'La base de datos está pendiente de actualización. Intenta nuevamente cuando se aplique la migración.'
            };
        }
        if (error.code === 'P2002') {
            return { statusCode: 409, mensaje: 'La operación ya fue procesada anteriormente.' };
        }
        if (error.code === 'P2003') {
            return { statusCode: 409, mensaje: 'La operación contiene una referencia que ya no existe.' };
        }
        return { statusCode: 500, mensaje: 'No se pudo completar la operación en la base de datos.' };
    }

    if (
        error instanceof Prisma.PrismaClientValidationError ||
        error instanceof Prisma.PrismaClientInitializationError
    ) {
        return { statusCode: 503, mensaje: 'La base de datos no está disponible en este momento.' };
    }

    if (error instanceof Error) {
        return { statusCode: 400, mensaje: error.message };
    }

    return { statusCode: 500, mensaje: 'No se pudo completar la operación.' };
}

export class StockInsuficienteError extends AppError {
    constructor(productoNombre: string) {
        super(`Transacción rechazada: Stock insuficiente para el producto [${productoNombre}]`, 409);
    }
}

export class CuentaNoActivadaError extends AppError {
    constructor() {
        super('Tu cuenta requiere verificación antes de ingresar.', 403);
    }
}
