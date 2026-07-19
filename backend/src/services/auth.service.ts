import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHmac, randomInt, randomBytes } from 'crypto';
import { prisma } from '../config/database';
import { OAuth2Client } from 'google-auth-library';
import { Prisma, PropositoCodigo, Rol } from '@prisma/client';
import { CorreoService } from './correo.service';
import { AppError, CuentaNoActivadaError } from '../errors/app.error';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(CLIENT_ID);

export class AuthService {
    private correoService = new CorreoService();

    private hashCodigo(codigo: string) {
        return createHmac('sha256', process.env.JWT_SECRET as string).update(codigo).digest('hex');
    }

    private generarCodigo() {
        return randomInt(100000, 1000000).toString();
    }

    private async prepararYEnviarCodigo(socioId: string, email: string, nombre: string, proposito: PropositoCodigo) {
        const codigo = this.generarCodigo();
        const ahora = new Date();
        const expira = new Date(ahora.getTime() + 10 * 60 * 1000);

        await prisma.socio.update({
            where: { id: socioId },
            data: {
                codigoVerificacionHash: this.hashCodigo(codigo),
                codigoVerificacionExpira: expira,
                codigoVerificacionEnviadoEn: ahora,
                intentosVerificacion: 0,
                propositoCodigo: proposito
            }
        });

        await this.correoService.enviar({
            destinatario: email,
            asunto: proposito === PropositoCodigo.ACTIVACION
                ? 'Activa tu cuenta de MiNegocio'
                : 'Recupera tu contraseña de MiNegocio',
            tipo: 'AUTENTICACION',
            html: `
                <div style="font-family:Arial,sans-serif;color:#334155;max-width:520px;margin:auto">
                    <h2 style="color:#0f172a">${proposito === PropositoCodigo.ACTIVACION ? 'Activa tu cuenta' : 'Recupera tu contraseña'}</h2>
                    <p>Hola, <strong>${nombre}</strong>.</p>
                    <p>Tu código de verificación es:</p>
                    <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb">${codigo}</p>
                    <p>El código vence en 10 minutos. Si no realizaste esta solicitud, ignora este mensaje.</p>
                </div>`
        });
    }

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
            const nombre = String(data.nombre ?? '').trim();
            const cedula = String(data.cedula ?? '').trim();
            const email = String(data.email ?? '').trim().toLowerCase();
            const password = String(data.password ?? '');
            const slug = String(data.slug ?? '').trim();

            if (nombre.length < 2 || nombre.length > 100) throw new Error('El nombre debe tener entre 2 y 100 caracteres.');
            if (!/^\d{10}(\d{3})?$/.test(cedula)) throw new Error('Ingresa una cédula de 10 dígitos o un RUC de 13 dígitos.');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresa un correo electrónico válido.');
            if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');

            const [porCedula, porEmail, negocio] = await Promise.all([
                prisma.socio.findUnique({ where: { cedula } }),
                prisma.socio.findUnique({ where: { email } }),
                slug ? prisma.negocio.findUnique({ where: { slug } }) : Promise.resolve(null)
            ]);

            if (porCedula || porEmail) {
                if (porCedula && porEmail && porCedula.id !== porEmail.id) {
                    throw new Error('La cédula y el correo pertenecen a cuentas diferentes.');
                }
                const existente = porCedula || porEmail;
                if (!existente || existente.rol !== Rol.CLIENTE) throw new Error('La identificación pertenece a un usuario interno.');
                if (existente.cuentaActivada) throw new Error('La cédula o el correo electrónico ya están registrados.');
                if (existente.cedula !== cedula || existente.email !== email) {
                    throw new Error('Los datos no coinciden con la cuenta pendiente de activación.');
                }
                if (existente.codigoVerificacionEnviadoEn && Date.now() - existente.codigoVerificacionEnviadoEn.getTime() < 60_000) {
                    throw new AppError('Ya enviamos un código. Espera un minuto antes de solicitar otro.', 429);
                }
            }
            if (slug && (!negocio || negocio.estado !== 'ACTIVO')) {
                throw new Error('La tienda seleccionada no existe o no se encuentra activa.');
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const cliente = await prisma.$transaction(async (tx) => {
                const existente = porCedula || porEmail;
                const nuevo = existente
                    ? await tx.socio.update({
                        where: { id: existente.id },
                        data: { password: hashedPassword }
                    })
                    : await tx.socio.create({
                        data: {
                            nombre,
                            cedula,
                            email,
                            password: hashedPassword,
                            cuentaActivada: false,
                            rol: Rol.CLIENTE,
                            negocioId: null
                        }
                    });

                if (negocio) {
                    await tx.clienteNegocio.upsert({
                        where: { clienteId_negocioId: { clienteId: nuevo.id, negocioId: negocio.id } },
                        update: { activo: true },
                        create: { clienteId: nuevo.id, negocioId: negocio.id, nombreReferencia: nombre, emailContacto: email }
                    });
                }
                return nuevo;
            });

            await this.prepararYEnviarCodigo(cliente.id, cliente.email, cliente.nombre, PropositoCodigo.ACTIVACION);
            return { cliente, requiereVerificacion: true };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new Error(`Este correo electrónico ya está registrado.`);
            }
            throw error;
        }
    }

    async reenviarCodigo(emailEntrada: string) {
        const email = String(emailEntrada ?? '').trim().toLowerCase();
        const socio = await prisma.socio.findUnique({ where: { email } });

        // Respuesta neutra para evitar revelar qué correos están registrados.
        if (!socio || socio.rol !== Rol.CLIENTE || socio.cuentaActivada) return;
        if (socio.codigoVerificacionEnviadoEn && Date.now() - socio.codigoVerificacionEnviadoEn.getTime() < 60_000) {
            return;
        }
        await this.prepararYEnviarCodigo(socio.id, socio.email, socio.nombre, PropositoCodigo.ACTIVACION);
    }

    async verificarCodigo(emailEntrada: string, codigoEntrada: string) {
        const email = String(emailEntrada ?? '').trim().toLowerCase();
        const codigo = String(codigoEntrada ?? '').trim();
        if (!/^\d{6}$/.test(codigo)) throw new AppError('El código debe contener 6 dígitos.', 422);

        const socio = await prisma.socio.findUnique({ where: { email } });
        if (!socio || socio.rol !== Rol.CLIENTE) throw new AppError('No fue posible verificar la cuenta.', 400);
        if (socio.cuentaActivada) return;
        if (socio.propositoCodigo !== PropositoCodigo.ACTIVACION) throw new AppError('Solicita un nuevo código de activación.', 400);
        if (!socio.codigoVerificacionHash || !socio.codigoVerificacionExpira || socio.codigoVerificacionExpira < new Date()) {
            throw new AppError('El código expiró. Solicita uno nuevo.', 410);
        }
        if (socio.intentosVerificacion >= 5) throw new AppError('Superaste el número de intentos. Solicita un código nuevo.', 429);

        if (this.hashCodigo(codigo) !== socio.codigoVerificacionHash) {
            await prisma.socio.update({
                where: { id: socio.id },
                data: { intentosVerificacion: { increment: 1 } }
            });
            throw new AppError('El código ingresado no es correcto.', 400);
        }

        await prisma.socio.update({
            where: { id: socio.id },
            data: {
                cuentaActivada: true,
                codigoVerificacionHash: null,
                codigoVerificacionExpira: null,
                codigoVerificacionEnviadoEn: null,
                intentosVerificacion: 0,
                propositoCodigo: null
            }
        });
    }

    async solicitarRecuperacion(emailEntrada: string) {
        const email = String(emailEntrada ?? '').trim().toLowerCase();
        const socio = await prisma.socio.findUnique({ where: { email } });

        // Siempre responde igual para no permitir enumeración de cuentas.
        if (!socio || !socio.cuentaActivada) return;
        if (socio.codigoVerificacionEnviadoEn && Date.now() - socio.codigoVerificacionEnviadoEn.getTime() < 60_000) return;

        await this.prepararYEnviarCodigo(socio.id, socio.email, socio.nombre, PropositoCodigo.RECUPERACION);
    }

    async restablecerPassword(emailEntrada: string, codigoEntrada: string, passwordEntrada: string) {
        const email = String(emailEntrada ?? '').trim().toLowerCase();
        const codigo = String(codigoEntrada ?? '').trim();
        const password = String(passwordEntrada ?? '');

        if (!/^\d{6}$/.test(codigo)) throw new AppError('El código debe contener 6 dígitos.', 422);
        if (password.length < 8) throw new AppError('La nueva contraseña debe tener al menos 8 caracteres.', 422);

        const socio = await prisma.socio.findUnique({ where: { email } });
        if (!socio || !socio.cuentaActivada || socio.propositoCodigo !== PropositoCodigo.RECUPERACION) {
            throw new AppError('No fue posible restablecer la contraseña.', 400);
        }
        if (!socio.codigoVerificacionHash || !socio.codigoVerificacionExpira || socio.codigoVerificacionExpira < new Date()) {
            throw new AppError('El código expiró. Solicita uno nuevo.', 410);
        }
        if (socio.intentosVerificacion >= 5) throw new AppError('Superaste el número de intentos. Solicita un código nuevo.', 429);

        if (this.hashCodigo(codigo) !== socio.codigoVerificacionHash) {
            await prisma.socio.update({
                where: { id: socio.id },
                data: { intentosVerificacion: { increment: 1 } }
            });
            throw new AppError('El código ingresado no es correcto.', 400);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.socio.update({
            where: { id: socio.id },
            data: {
                password: passwordHash,
                codigoVerificacionHash: null,
                codigoVerificacionExpira: null,
                codigoVerificacionEnviadoEn: null,
                intentosVerificacion: 0,
                propositoCodigo: null
            }
        });
    }

    async obtenerPerfil(socioId: string) {
        const socio = await prisma.socio.findUnique({
            where: { id: socioId },
            select: {
                id: true,
                nombre: true,
                cedula: true,
                email: true,
                rol: true,
                negocioId: true,
                negocio: { select: { nombre: true, slug: true } }
            }
        });

        if (!socio) throw new AppError('La cuenta ya no existe.', 404);
        return socio;
    }

    async actualizarPerfil(socioId: string, data: any) {
        const nombre = String(data?.nombre ?? '').trim();
        const cedula = String(data?.cedula ?? '').trim();
        const email = String(data?.email ?? '').trim().toLowerCase();

        if (nombre.length < 2 || nombre.length > 100) {
            throw new AppError('El nombre debe tener entre 2 y 100 caracteres.', 422);
        }
        if (!/^\d{10}(\d{3})?$/.test(cedula)) {
            throw new AppError('Ingresa una cédula de 10 dígitos o un RUC de 13 dígitos.', 422);
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
            throw new AppError('Ingresa un correo electrónico válido.', 422);
        }

        try {
            await prisma.socio.update({
                where: { id: socioId },
                data: { nombre, cedula, email }
            });
            return this.obtenerPerfil(socioId);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new AppError('La cuenta ya no existe.', 404);
            }
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const campos = Array.isArray(error.meta?.target) ? error.meta.target.join(' ') : String(error.meta?.target ?? '');
                throw new AppError(campos.includes('cedula')
                    ? 'La cédula o RUC ya está registrada.'
                    : 'El correo electrónico ya está registrado.', 409);
            }
            throw error;
        }
    }

    async cambiarPassword(socioId: string, passwordActualEntrada: string, passwordNuevaEntrada: string) {
        const passwordActual = String(passwordActualEntrada ?? '');
        const passwordNueva = String(passwordNuevaEntrada ?? '');
        if (!passwordActual) throw new AppError('La contraseña actual es obligatoria.', 422);
        if (passwordNueva.length < 8) throw new AppError('La nueva contraseña debe tener al menos 8 caracteres.', 422);
        if (passwordActual === passwordNueva) throw new AppError('La nueva contraseña debe ser diferente a la actual.', 422);

        const socio = await prisma.socio.findUnique({ where: { id: socioId } });
        if (!socio) throw new AppError('La cuenta ya no existe.', 404);
        if (!await bcrypt.compare(passwordActual, socio.password)) {
            throw new AppError('La contraseña actual no es correcta.', 400);
        }

        await prisma.socio.update({
            where: { id: socioId },
            data: { password: await bcrypt.hash(passwordNueva, 10) }
        });
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
        if (!socio.cuentaActivada) throw new CuentaNoActivadaError();

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
                if (!socio.cuentaActivada && socio.rol === Rol.CLIENTE) {
                    socio = await prisma.socio.update({
                        where: { id: socio.id },
                        data: {
                            cuentaActivada: true,
                            codigoVerificacionHash: null,
                            codigoVerificacionExpira: null,
                            codigoVerificacionEnviadoEn: null,
                            intentosVerificacion: 0,
                            propositoCodigo: null
                        },
                        include: { negocio: true }
                    });
                }
                if (socio.negocio) {
                    if (socio.negocio.estado === 'PENDIENTE') {
                        throw new Error('Tu cuenta está en revisión. Un administrador debe aprobar tu solicitud.');
                    }
                    if (socio.negocio.estado === 'BLOQUEADO') {
                        throw new Error('Tu cuenta ha sido suspendida. Contacta a soporte.');
                    }
                }
            } else {
                const passwordAleatoria = randomBytes(32).toString('hex');
                const salt = await bcrypt.genSalt(10);
                const hashedRandomPass = await bcrypt.hash(passwordAleatoria, salt);
                socio = await prisma.socio.create({
                    data: {
                        nombre: payload.name || 'Usuario Google',
                        email: payload.email,
                        password: hashedRandomPass,
                        cuentaActivada: true,
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
