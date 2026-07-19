import nodemailer, { Transporter } from 'nodemailer';
import { AppError } from '../errors/app.error';

interface AdjuntoCorreo {
    nombre: string;
    contenido: Buffer;
}

interface DatosCorreo {
    destinatario: string;
    asunto: string;
    html: string;
    tipo: 'FACTURA' | 'AUTENTICACION';
    adjuntos?: AdjuntoCorreo[];
}

export class CorreoService {
    private transporter: Transporter | null = null;

    private obtenerTransporter(): Transporter {
        const usuario = process.env.EMAIL_USER;
        const password = process.env.EMAIL_APP_PASSWORD?.replace(/\s/g, '');
        if (!usuario || !password) {
            throw new AppError('El servicio de correo todavía no está configurado.', 503);
        }

        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: { user: usuario, pass: password }
            });
        }
        return this.transporter;
    }

    async enviar(datos: DatosCorreo): Promise<string> {
        const usuario = process.env.EMAIL_USER as string;
        const nombreRemitente = datos.tipo === 'FACTURA'
            ? process.env.EMAIL_NAME_FACTURAS || 'Facturación MiNegocio'
            : process.env.EMAIL_NAME_AUTH || 'Seguridad MiNegocio';

        let resultado;
        try {
            resultado = await this.obtenerTransporter().sendMail({
                from: `"${nombreRemitente.replace(/["\r\n]/g, '')}" <${usuario}>`,
                to: datos.destinatario,
                subject: datos.asunto,
                html: datos.html,
                attachments: datos.adjuntos?.map(adjunto => ({
                    filename: adjunto.nombre,
                    content: adjunto.contenido
                }))
            });
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            if (error?.code === 'EAUTH') {
                throw new AppError('Gmail rechazó las credenciales de correo. Revisa la contraseña de aplicación.', 503);
            }
            if (['ECONNECTION', 'ETIMEDOUT', 'ESOCKET'].includes(error?.code)) {
                throw new AppError('No se pudo establecer conexión con Gmail.', 503);
            }
            throw new AppError('Gmail no pudo enviar el correo.', 502);
        }

        if (!resultado.messageId) {
            throw new Error('Gmail no devolvió el identificador del correo');
        }
        return resultado.messageId;
    }
}
