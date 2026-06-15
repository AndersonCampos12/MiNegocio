import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { OAuth2Client } from 'google-auth-library'; // <-- NUEVO
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // <-- NUEVO

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
    async loginGoogle(googleToken: string) {
        // 1. Verificar el token con los servidores de Google
        const ticket = await googleClient.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) throw new Error('Token de Google inválido');

        const { email, name } = payload;

        // 2. Buscar si el socio ya está registrado
        let socio = await prisma.socio.findUnique({ where: { email } });

        // 3. Si es la primera vez que entra con Google, le creamos la cuenta automáticamente
        if (!socio) {
            const resultado = await prisma.$transaction(async (tx) => {
                // Creamos un negocio genérico para que no se quede sin entorno
                const negocio = await tx.negocio.create({
                    data: {
                        nombre: `Negocio de ${name}`,
                        slug: email.split('@')[0], // Usamos la primera parte del correo como slug
                        plan: 'FREE'
                    }
                });

                // Creamos el socio con password vacío (porque se loguea con Google)
                const nuevoSocio = await tx.socio.create({
                    data: {
                        negocioId: negocio.id,
                        nombre: name || 'Usuario de Google',
                        email: email,
                        password: ''
                    }
                });

                return nuevoSocio;
            });
            socio = resultado;
        }

        // 4. Generar el Token JWT del sistema
        const token = jwt.sign(
            { id: socio.id, negocioId: socio.negocioId, nombre: socio.nombre },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        return { socio: { id: socio.id, nombre: socio.nombre }, token };
    }
}