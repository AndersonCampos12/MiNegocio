import { Resend } from 'resend';

interface AdjuntoCorreo {
    nombre: string;
    contenido: Buffer;
}

interface DatosCorreo {
    destinatario: string;
    asunto: string;
    html: string;
    adjuntos?: AdjuntoCorreo[];
}

export class CorreoService {
    private obtenerCliente(): Resend {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            throw new Error('Falta configurar RESEND_API_KEY');
        }

        return new Resend(apiKey);
    }

    async enviar(datos: DatosCorreo): Promise<string> {
        const remitente = process.env.EMAIL_FROM;

        if (!remitente) {
            throw new Error('Falta configurar EMAIL_FROM');
        }

        const { data, error } = await this.obtenerCliente().emails.send({
            from: remitente,
            to: [datos.destinatario],
            subject: datos.asunto,
            html: datos.html,
            attachments: datos.adjuntos?.map(adjunto => ({
                filename: adjunto.nombre,
                content: adjunto.contenido
            }))
        });

        if (error) {
            throw new Error(`Resend rechazó el correo: ${error.message}`);
        }

        if (!data?.id) {
            throw new Error('Resend no devolvió el identificador del correo');
        }

        return data.id;
    }
}
