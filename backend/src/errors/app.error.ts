export class AppError extends Error {
    public readonly statusCode: number;

    constructor(mensaje: string, statusCode = 400) {
        super(mensaje);
        this.statusCode = statusCode;
        // Aquí está la corrección: new.target en minúsculas
        Object.setPrototypeOf(this, new.target.prototype);
    }
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
