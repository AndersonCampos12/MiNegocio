type PocketBaseAuthResponse = { token?: string };
type PocketBaseLogoRecord = { id?: string; logo?: string };

export class PocketBaseStorageService {
    private readonly baseUrl = (process.env.POCKETBASE_URL || '').replace(/\/$/, '');
    private readonly collection = process.env.POCKETBASE_LOGOS_COLLECTION || 'negocio_logos';

    private validarConfiguracion() {
        if (!this.baseUrl) throw new Error('POCKETBASE_NOT_CONFIGURED');
    }

    private async obtenerToken(): Promise<string> {
        const tokenConfigurado = process.env.POCKETBASE_TOKEN?.trim();
        if (tokenConfigurado) return tokenConfigurado;

        const identity = process.env.POCKETBASE_SUPERUSER_EMAIL;
        const password = process.env.POCKETBASE_SUPERUSER_PASSWORD;
        if (!identity || !password) throw new Error('POCKETBASE_NOT_CONFIGURED');

        const respuesta = await fetch(`${this.baseUrl}/api/collections/_superusers/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity, password })
        });
        if (!respuesta.ok) {
            let detalle = '';
            try {
                const cuerpoError = await respuesta.json();
                detalle = JSON.stringify(cuerpoError);
            } catch {
                detalle = await respuesta.text().catch(() => '');
            }
            console.error(`PocketBase upload failed [${respuesta.status}]:`, detalle);
            throw new Error(`POCKETBASE_UPLOAD_FAILED: ${respuesta.status} ${detalle}`);
        }
        const datos = await respuesta.json() as PocketBaseAuthResponse;
        if (!datos.token) throw new Error('POCKETBASE_AUTH_FAILED');
        return datos.token;
    }

    async guardarLogo(negocioId: string, archivo: Express.Multer.File, registroId?: string | null): Promise<{ url: string; registroId: string }> {
        this.validarConfiguracion();
        const token = await this.obtenerToken();
        const formData = new FormData();
        formData.append('negocioId', negocioId);
        const contenido = archivo.buffer.buffer.slice(
            archivo.buffer.byteOffset,
            archivo.buffer.byteOffset + archivo.buffer.byteLength
        ) as ArrayBuffer;
        formData.append('logo', new Blob([contenido], { type: archivo.mimetype }), archivo.originalname);

        const rutaRegistro = registroId ? `/records/${encodeURIComponent(registroId)}` : '/records';
        const respuesta = await fetch(`${this.baseUrl}/api/collections/${encodeURIComponent(this.collection)}${rutaRegistro}`, {
            method: registroId ? 'PATCH' : 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        if (!respuesta.ok) {
            let detalle = '';
            try {
                const cuerpoError = await respuesta.json();
                detalle = JSON.stringify(cuerpoError);
            } catch {
                detalle = await respuesta.text().catch(() => '');
            }
            console.error(`PocketBase upload failed [${respuesta.status}] en ${respuesta.url}:`, detalle);
            throw new Error(`POCKETBASE_UPLOAD_FAILED: ${respuesta.status} ${detalle}`);
        }

        const registro = await respuesta.json() as PocketBaseLogoRecord;
        if (!registro.id || !registro.logo) throw new Error('POCKETBASE_INVALID_RESPONSE');
        return {
            registroId: registro.id,
            url: `${this.baseUrl}/api/files/${encodeURIComponent(this.collection)}/${registro.id}/${encodeURIComponent(registro.logo)}`
        };
    }
}
