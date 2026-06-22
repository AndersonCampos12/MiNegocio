import { prisma } from '../config/database'; // O '../index' dependiendo de dónde exportes tu prisma
import bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

export const crearNegocioConAdmin = async (data: {
    nombreNegocio: string;
    slug: string;
    nombreAdmin: string;
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
                estado: 'ACTIVO', // O 'PENDIENTE' si requiere validación extra
            },
        });

        const nuevoAdmin = await tx.socio.create({
            data: {
                nombre: data.nombreAdmin,
                email: data.emailAdmin,
                password: hashedPassword,
                rol: 'ADMINISTRADOR',
                negocioId: nuevoNegocio.id,
            },
        });

        return { negocio: nuevoNegocio, admin: nuevoAdmin };
    });
};