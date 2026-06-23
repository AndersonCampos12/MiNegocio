import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { OAuth2Client } from 'google-auth-library';
import { Prisma, Rol } from '@prisma/client';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(CLIENT_ID);

export class AuthService {

    // 1. EXCLUSIVO PARA EL SUPERADMIN (Dueños de Negocios)
    async crearEmpresaYAdmin(data: any) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);

            const resultado = await prisma.$transaction(async (tx) => {
                const negocio = await tx.negocio.create({
                    data: {
                        nombre: data.negocioNombre,
                        slug: data.negocioNombre.toLowerCase().replace(/\s+/g, '-'),
                        plan: data.plan || 'MULTI',
                        estado: 'ACTIVO'
                    }
                });

                const socio = await tx.socio.create({
                    data: {
                        negocioId: negocio.id, // ¡El Admin SÍ nace amarrado a su empresa!
                        nombre: data.adminNombre,
                        email: data.email,
                        password: hashedPassword,
                        rol: Rol.ADMINISTRADOR
                    }
                });

                return { negocio, socio };
            });

            return resultado;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new Error(`El correo o nombre de la empresa ya están registrados.`);
            }
            throw error;
        }
    }

    // 2. EXCLUSIVO PARA CLIENTES (¡Ahora son globales!)
    async registrarCliente(data: any) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);

            const cliente = await prisma.socio.create({
                data: {
                    // NUEVO: Ya no pedimos negocioId. Nace libre.
                    nombre: data.nombre,
                    email: data.email,
                    password: hashedPassword,
                    rol: Rol.CLIENTE
                }
            });

            return cliente;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new Error(`Este correo electrónico ya está registrado.`);
            }
            throw error;
        }
    }

    // 3. LOGIN UNIVERSAL (Soporta usuarios con y sin empresa)
    async login(email: string, password: string) {
        const socio = await prisma.socio.findUnique({
            where: { email },
            include: { negocio: true }
        });

        if (!socio) throw new Error('Credenciales inválidas');

        // NUEVO: Solo verificamos el estado si el usuario PERTENECE a un negocio
        if (socio.negocio) {
            if (socio.negocio.estado === 'PENDIENTE') {
                throw new Error('La cuenta de esta empresa está en revisión.');
            }
            if (socio.negocio.estado === 'BLOQUEADO') {
                throw new Error('La cuenta de esta empresa ha sido suspendida.');
            }
        }

        const passValido = await bcrypt.compare(password, socio.password);
        if (!passValido) throw new Error('Credenciales inválidas');

        // ✅ CÓMO DEBES DEJARLO EN auth.service.ts:
        const token = jwt.sign(
            {
                id: socio.id, // o usuario.id, dependiendo de cómo lo llamaste en ese archivo
                nombre: socio.nombre, // <-- ¡ESTA ES LA LÍNEA MÁGICA QUE TE FALTA!
                rol: socio.rol,
                negocioId: socio.negocioId
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '8h' }
        );

        // NUEVO: Usamos socio.negocio?.slug por si es un cliente global que no tiene negocio
        return {
            socio: {
                id: socio.id,
                nombre: socio.nombre,
                rol: socio.rol,
                negocioId: socio.negocioId,   // ← añadir esta línea
                slug: socio.negocio?.slug
            },
            token
        };
    }

    // 4. LOGIN GOOGLE UNIFICADO (Marketplace)
    async loginGoogle(tokenGoogle: string) {
        try {
            const ticket = await googleClient.verifyIdToken({ idToken: tokenGoogle, audience: CLIENT_ID });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) throw new Error('Token de Google inválido');

            let socio = await prisma.socio.findUnique({
                where: { email: payload.email },
                include: { negocio: true }
            });

            if (socio) {
                if (socio.negocio) {
                    if (socio.negocio.estado === 'PENDIENTE') {
                        throw new Error('Tu cuenta está en revisión. Un administrador debe aprobar tu solicitud.');
                    }
                    if (socio.negocio.estado === 'BLOQUEADO') {
                        throw new Error('Tu cuenta ha sido suspendida. Contacta a soporte.');
                    }
                }
            } else {
                const passwordAleatoria = Math.random().toString(36).slice(-12);
                const salt = await bcrypt.genSalt(10);
                const hashedRandomPass = await bcrypt.hash(passwordAleatoria, salt);
                socio = await prisma.socio.create({
                    data: {
                        nombre: payload.name || 'Usuario Google',
                        email: payload.email,
                        password: hashedRandomPass,
                        rol: Rol.CLIENTE
                    },
                    include: { negocio: true }
                });
            }

            // ✅ JWT idéntico al login normal (añadido nombre)
            const tokenLocal = jwt.sign(
                {
                    id: socio.id,
                    nombre: socio.nombre,
                    rol: socio.rol,
                    negocioId: socio.negocioId
                },
                process.env.JWT_SECRET as string,
                { expiresIn: '8h' }
            );

            // ✅ Respuesta idéntica al login normal (añadido negocioId, unificado socio/usuario)
            return {
                token: tokenLocal,
                socio: {
                    id: socio.id,
                    nombre: socio.nombre,
                    email: socio.email,
                    rol: socio.rol,
                    negocioId: socio.negocioId,
                    slug: socio.negocio?.slug
                }
            };
        } catch (error) {
            console.error('Error en loginGoogle:', error);
            if (error instanceof Error) throw error;
            throw new Error('Error al autenticar con Google');
        }
    }
}