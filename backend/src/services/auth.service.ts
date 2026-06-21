import bcrypt from 'bcryptjs'; // Asegúrate de usar bcryptjs si bcrypt te da problemas en Node
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { OAuth2Client } from 'google-auth-library';
import { Prisma } from '@prisma/client'; // NUEVO: Para manejar los errores exactos

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(CLIENT_ID);

export class AuthService {

    // Método para crear el primer Admin (Cuando compran tu sistema)
    async registrarNegocio(data: any) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);

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
                        password: hashedPassword,
                        rol: 'ADMINISTRADOR' // Le asignamos el rol máximo
                    }
                });

                return { negocio, socio };
            });

            return resultado;
        } catch (error) {
            // MAGIA: Aquí atrapamos el error de duplicados para que el server no se caiga
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new Error(`El correo o nombre de negocio ya está registrado.`);
                }
            }
            throw error;
        }
    }

    async login(email: string, password: string) {
        // 1. Buscar al socio INCLUYENDO los datos de su negocio
        const socio = await prisma.socio.findUnique({
            where: { email },
            include: { negocio: true } // <-- CLAVE: Traemos la tabla relacionada
        });

        if (!socio) throw new Error('Credenciales inválidas');

        // 2. NUEVO: Verificar el estado del negocio antes de revisar la contraseña
        if (socio.negocio.estado === 'PENDIENTE') {
            throw new Error('Tu cuenta está en revisión. Un administrador debe aprobar tu solicitud.');
        }

        if (socio.negocio.estado === 'BLOQUEADO') {
            throw new Error('Tu cuenta ha sido suspendida. Contacta a soporte.');
        }

        // 3. Verificar la contraseña
        const passValido = await bcrypt.compare(password, socio.password);
        if (!passValido) throw new Error('Credenciales inválidas');

        // 4. Generar el Token JWT
        const token = jwt.sign(
            {
                id: socio.id,
                negocioId: socio.negocioId,
                nombre: socio.nombre,
                rol: socio.rol
            },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        return {
            socio: { id: socio.id, nombre: socio.nombre, rol: socio.rol },
            token
        };
    }

    async loginGoogle(tokenGoogle: string) {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: tokenGoogle,
                audience: CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) throw new Error('Token de Google inválido');

            let socio = await prisma.socio.findUnique({ where: { email: payload.email } });

            if (!socio) {
                const nombreBase = payload.name || 'Usuario';
                const slugGenerado = `${nombreBase.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

                const nuevoNegocio = await prisma.negocio.create({
                    data: {
                        nombre: `Negocio de ${nombreBase}`,
                        slug: slugGenerado
                    }
                });

                const passwordAleatoria = Math.random().toString(36).slice(-12);
                const salt = await bcrypt.genSalt(10);
                const hashedRandomPass = await bcrypt.hash(passwordAleatoria, salt);

                socio = await prisma.socio.create({
                    data: {
                        nombre: nombreBase,
                        email: payload.email,
                        password: hashedRandomPass,
                        negocioId: nuevoNegocio.id,
                        rol: 'CLIENTE' // Entra con Google = Cliente por defecto
                    }
                });
            }

            const tokenLocal = jwt.sign(
                { id: socio.id, email: socio.email, rol: socio.rol },
                process.env.JWT_SECRET || 'tu_firma_secreta',
                { expiresIn: '8h' }
            );

            return {
                token: tokenLocal,
                usuario: { id: socio.id, nombre: socio.nombre, email: socio.email, rol: socio.rol }
            };
        } catch (error) {
            console.error('Error en loginGoogle:', error);
            throw new Error('Error al autenticar con Google');
        }
    }
}