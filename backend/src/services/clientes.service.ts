import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class ClientesService {

    // Buscar clientes por coincidencia de nombre o cédula/RUC
    async buscarClientes(termino: string, negocioId: string) {
        return prisma.socio.findMany({
            where: {
                negocioId: negocioId,
                rol: 'CLIENTE',
                OR: [
                    { nombre: { contains: termino, mode: 'insensitive' } },
                    { cedula: { contains: termino, mode: 'insensitive' } }
                ]
            },
            take: 5
        });
    }

    // Crear cliente controlando restricciones de unicidad
    async crearCliente(data: any) {
        try {
            return await prisma.socio.create({
                data: {
                    nombre: data.nombre,
                    email: data.email,
                    cedula: data.cedula,
                    password: 'CLIENTE_SIN_ACCESO_PASSWORD', // Contraseña dummy ya que es solo para facturación
                    rol: 'CLIENTE',
                    negocioId: data.negocioId
                }
            });
        } catch (error) {
            // P2002 es el código de Prisma para violaciones de campos únicos (@unique)
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const target = (error.meta?.target as string[]) || [];

                if (target.includes('cedula')) {
                    throw new Error('La cédula o RUC ya se encuentra registrada en este negocio.');
                }
                if (target.includes('email')) {
                    throw new Error('El correo electrónico ya está registrado.');
                }
            }
            throw error;
        }
    }
}