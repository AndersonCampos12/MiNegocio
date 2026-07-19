import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AppError } from '../errors/app.error';
import { isPrismaError } from '../utils/prisma-error';
import { z } from 'zod';

const clienteSchema = z.object({
    nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(100),
    email: z.string().trim().toLowerCase().email('Ingresa un correo electrónico válido.').max(254),
    cedula: z.string().trim().regex(/^\d{10}(\d{3})?$/, 'La cédula debe tener 10 dígitos y el RUC 13 dígitos.')
});

const contactoSchema = z.object({
    nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(100),
    email: z.string().trim().toLowerCase().email('Ingresa un correo electrónico válido.').max(254)
});

export class ClientesService {
    async obtenerClientes(negocioId: string, activo?: boolean) {
        const membresias = await prisma.clienteNegocio.findMany({
            where: { negocioId, ...(activo === undefined ? {} : { activo }) },
            select: {
                id: true,
                activo: true,
                creadoEn: true,
                nombreReferencia: true,
                emailContacto: true,
                cliente: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        cedula: true,
                        cuentaActivada: true
                    }
                }
            },
            orderBy: { creadoEn: 'desc' }
        });

        const ids = membresias.map(item => item.cliente.id);
        const ventas = ids.length
            ? await prisma.venta.groupBy({
                by: ['clienteId'],
                where: { negocioId, clienteId: { in: ids } },
                _count: { id: true },
                _sum: { total: true }
            })
            : [];
        const resumen = new Map(ventas.map(item => [item.clienteId, item]));

        return membresias.map(item => {
            const compras = resumen.get(item.cliente.id);
            return {
                membresiaId: item.id,
                clienteId: item.cliente.id,
                nombre: item.nombreReferencia || item.cliente.nombre,
                email: item.emailContacto || item.cliente.email,
                cedula: item.cliente.cedula,
                cuentaActivada: item.cliente.cuentaActivada,
                activo: item.activo,
                creadoEn: item.creadoEn,
                totalCompras: compras?._count.id || 0,
                montoCompras: Number(compras?._sum.total || 0)
            };
        });
    }

    async buscarClientes(termino: string, negocioId: string) {
        const membresias = await prisma.clienteNegocio.findMany({
            where: {
                negocioId,
                activo: true,
                OR: [
                    { nombreReferencia: { contains: termino, mode: 'insensitive' } },
                    { emailContacto: { contains: termino, mode: 'insensitive' } },
                    {
                        cliente: {
                            rol: 'CLIENTE',
                            OR: [
                                { nombre: { contains: termino, mode: 'insensitive' } },
                                { cedula: { contains: termino, mode: 'insensitive' } },
                                { email: { contains: termino, mode: 'insensitive' } }
                            ]
                        }
                    }
                ]
            },
            select: {
                nombreReferencia: true,
                emailContacto: true,
                cliente: {
                    select: { id: true, nombre: true, cedula: true, email: true }
                }
            },
            take: 5,
            orderBy: { creadoEn: 'desc' }
        });

        return membresias.map(({ cliente, nombreReferencia, emailContacto }) => ({
            ...cliente,
            nombre: nombreReferencia || cliente.nombre,
            email: emailContacto || cliente.email
        }));
    }

    async crearOVincularCliente(data: unknown, negocioId: string) {
        const validacion = clienteSchema.safeParse(data);
        if (!validacion.success) {
            throw new AppError(validacion.error.issues[0]?.message || 'Los datos del cliente no son válidos.', 422);
        }

        const datos = validacion.data;

        try {
            return await prisma.$transaction(async (tx) => {
                const [porCedula, porEmail] = await Promise.all([
                    tx.socio.findUnique({ where: { cedula: datos.cedula } }),
                    tx.socio.findUnique({ where: { email: datos.email } })
                ]);

                if (porCedula && porEmail && porCedula.id !== porEmail.id) {
                    throw new AppError('La cédula y el correo pertenecen a cuentas diferentes.', 409);
                }
                if (porEmail?.cedula && porEmail.cedula !== datos.cedula) {
                    throw new AppError('El correo electrónico pertenece a otra cédula.', 409);
                }

                let cliente = porCedula || porEmail;
                let identidadCreada = false;

                if (cliente && cliente.rol !== 'CLIENTE') {
                    throw new AppError('La identificación pertenece a un usuario interno del sistema.', 409);
                }

                if (!cliente) {
                    const passwordNoUtilizable = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
                    cliente = await tx.socio.create({
                        data: {
                            nombre: datos.nombre,
                            email: datos.email,
                            cedula: datos.cedula,
                            password: passwordNoUtilizable,
                            cuentaActivada: false,
                            rol: 'CLIENTE',
                            negocioId: null
                        }
                    });
                    identidadCreada = true;
                }

                const membresia = await tx.clienteNegocio.upsert({
                    where: {
                        clienteId_negocioId: {
                            clienteId: cliente.id,
                            negocioId
                        }
                    },
                    update: {
                        nombreReferencia: datos.nombre,
                        emailContacto: datos.email,
                        activo: true
                    },
                    create: {
                        clienteId: cliente.id,
                        negocioId,
                        nombreReferencia: datos.nombre,
                        emailContacto: datos.email
                    }
                });

                return {
                    cliente: {
                        id: cliente.id,
                        nombre: datos.nombre,
                        cedula: cliente.cedula,
                        email: datos.email
                    },
                    membresiaCreada: membresia.creadoEn,
                    identidadCreada
                };
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (isPrismaError(error, 'P2002')) {
                throw new AppError('La cédula o el correo ya se encuentran registrados.', 409);
            }
            if (isPrismaError(error, 'P2003')) {
                throw new AppError('La empresa indicada no existe.', 422);
            }
            throw new AppError('No fue posible registrar el cliente. Inténtalo nuevamente.', 500);
        }
    }

    async actualizarContacto(membresiaId: string, data: unknown, negocioId: string) {
        const validacion = contactoSchema.safeParse(data);
        if (!validacion.success) {
            throw new AppError(validacion.error.issues[0]?.message || 'Los datos de contacto no son válidos.', 422);
        }

        const membresia = await prisma.clienteNegocio.findFirst({
            where: { id: membresiaId, negocioId },
            select: { id: true }
        });
        if (!membresia) throw new AppError('El cliente no pertenece a este negocio.', 404);

        return prisma.clienteNegocio.update({
            where: { id: membresia.id },
            data: {
                nombreReferencia: validacion.data.nombre,
                emailContacto: validacion.data.email
            }
        });
    }

    async cambiarEstado(membresiaId: string, activo: boolean, negocioId: string) {
        const membresia = await prisma.clienteNegocio.findFirst({
            where: { id: membresiaId, negocioId },
            select: { id: true }
        });
        if (!membresia) throw new AppError('El cliente no pertenece a este negocio.', 404);

        return prisma.clienteNegocio.update({
            where: { id: membresia.id },
            data: { activo }
        });
    }
}
