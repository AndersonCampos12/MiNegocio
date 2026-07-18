import { prisma } from '../config/database'; // O '../index' dependiendo de dónde exportes tu prisma
import bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

export const crearNegocioConAdmin = async (data: {
    nombreNegocio: string;
    slug: string;
    plan?: string;
    estado?: 'PENDIENTE' | 'ACTIVO' | 'BLOQUEADO';
    nombreAdmin: string;
    cedulaAdmin: string;
    emailAdmin: string;
    passwordAdmin: string;
}) => {
    const hashedPassword = await bcrypt.hash(data.passwordAdmin, 10);

    // Ejecutamos ambas creaciones en una sola transacción
    return prisma.$transaction(async (tx) => {
        const nuevoNegocio = await tx.negocio.create({
            data: {
                nombre: data.nombreNegocio,
                slug: data.slug,
                plan: data.plan || 'MULTI',
                estado: data.estado || 'ACTIVO',
            },
        });

        const nuevoAdmin = await tx.socio.create({
            data: {
                nombre: data.nombreAdmin,
                cedula: data.cedulaAdmin,
                email: data.emailAdmin,
                password: hashedPassword,
                rol: 'ADMINISTRADOR',
                negocioId: nuevoNegocio.id,
            },
        });

        return { negocio: nuevoNegocio, admin: nuevoAdmin };
    });
};
