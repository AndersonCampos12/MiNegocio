import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(CLIENT_ID);

export class AuthService {
    async registrarNegocio(data: any) {
        // 1. Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        // 2. Crear negocio y el socio en una sola transacción para evitar inconsistencias
        const resultado = await prisma.$transaction(async (tx) => {
            const negocio = await tx.negocio.create({
                data: {
                    nombre: data.negocioNombre,
                    slug: data.negocioNombre.toLowerCase().replace(/ /g, '-'),
                    plan: data.plan || 'MULTI',
                }
            });

            const socio = await tx.socio.create({
                data: {
                    negocioId: negocio.id,
                    nombre: data.adminNombre,
                    email: data.email,
                    password: hashedPassword
                }
            });

            return { negocio, socio };
        });

        return resultado;
    }

    async login(email: string, password: string) {
        // 1. Buscar al socio
        const socio = await prisma.socio.findUnique({ where: { email } });
        if (!socio) throw new Error('Credenciales inválidas');

        // 2. Verificar la contraseña
        const passValido = await bcrypt.compare(password, socio.password);
        if (!passValido) throw new Error('Credenciales inválidas');

        // 3. Generar el Token JWT
        const token = jwt.sign(
            { id: socio.id, negocioId: socio.negocioId, nombre: socio.nombre },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        return { socio: { id: socio.id, nombre: socio.nombre }, token };
    }

    // NUEVO MÉTODO PARA OAUTH
    async loginGoogle(tokenGoogle: string) {
        // 1. Verificamos el token con Google
        const ticket = await googleClient.verifyIdToken({
            idToken: tokenGoogle,
            audience: CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            throw new Error('Token de Google inválido o no contiene un email');
        }

        // 2. Buscamos en PostgreSQL si ese correo ya existe
        let socio = await prisma.socio.findUnique({
            where: { email: payload.email }
        });

        // 3. LA MAGIA DEL AUTO-REGISTRO
        if (!socio) {
            const nombreBase = payload.name || 'Usuario';

            // Generamos un slug seguro: minúsculas, sin espacios y con la fecha para que sea único
            const slugGenerado = `${nombreBase.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

            // Creamos un negocio por defecto para este nuevo usuario
            const nuevoNegocio = await prisma.negocio.create({
                data: {
                    nombre: `Negocio de ${nombreBase}`,
                    slug: slugGenerado // <-- ¡ESTA ES LA LÍNEA QUE FALTABA!
                }
            });

            // Creamos al socio. Le ponemos una contraseña aleatoria porque entrará con Google
            const passwordAleatoria = Math.random().toString(36).slice(-12);

            socio = await prisma.socio.create({
                data: {
                    nombre: nombreBase,
                    email: payload.email,
                    password: passwordAleatoria,
                    negocioId: nuevoNegocio.id
                }
            });
        }

        // 4. Generamos el JWT local para que tu app funcione normal
        const tokenLocal = jwt.sign(
            { id: socio.id, email: socio.email },
            process.env.JWT_SECRET || 'tu_firma_secreta',
            { expiresIn: '8h' }
        );

        // 5. Devolvemos la data tal cual la espera tu Angular
        return {
            token: tokenLocal,
            usuario: {
                id: socio.id,
                nombre: socio.nombre,
                email: socio.email
            }
        };
    }
}