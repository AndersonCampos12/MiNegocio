import fs from 'fs';
import path from 'path';

export class LoggerService {
    private static logPath = path.join(__dirname, '../../logs/app.log');

    constructor() {
        const dir = path.dirname(LoggerService.logPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private registrar(nivel: 'INFO' | 'WARN' | 'ERROR', mensaje: string, contexto: string) {
        const timestamp = new Date().toISOString();
        const logEstructurado = `[${timestamp}] [${nivel}] [${contexto}]: ${mensaje}\n`;

        // Imprime en la consola de desarrollo
        console.log(logEstructurado.trim());

        // Guarda en archivo físico de persistencia para auditoría del docente
        fs.appendFileSync(LoggerService.logPath, logEstructurado);
    }

    info(mensaje: string, contexto: string) { this.registrar('INFO', mensaje, contexto); }
    warn(mensaje: string, contexto: string) { this.registrar('WARN', mensaje, contexto); }
    error(mensaje: string, contexto: string) { this.registrar('ERROR', mensaje, contexto); }
}

export const logger = new LoggerService();