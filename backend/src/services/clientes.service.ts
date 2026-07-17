import { prisma } from '../config/database';
import { AppError } from '../errors/app.error';
import { isPrismaError, prismaErrorFields } from '../utils/prisma-error';
import { z } from 'zod';

const clienteSchema = z.object({
    nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(100),
    email: z.string().trim().toLowerCase().email('Ingresa un correo electrónico válido.'),
    cedula: z.string().trim().regex(/^\d{10}(\d{3})?$/, 'La cédula debe tener 10 dígitos y el RUC 13 dígitos.'),
    negocioId: z.string().uuid('La empresa seleccionada no es válida.')
});

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
        const validacion = clienteSchema.safeParse(data);
        if (!validacion.success) {
            throw new AppError(validacion.error.issues[0]?.message || 'Los datos del cliente no son válidos.', 422);
        }

        try {
            const cliente = validacion.data;
            return await prisma.socio.create({
                data: {
                    nombre: cliente.nombre,
                    email: cliente.email,
                    cedula: cliente.cedula,
                    password: 'CLIENTE_SIN_ACCESO_PASSWORD', // Contraseña dummy ya que es solo para facturación
                    rol: 'CLIENTE',
                    negocioId: cliente.negocioId
                }
            });
        } catch (error) {
            // P2002 es el código de Prisma para violaciones de campos únicos (@unique)
            if (isPrismaError(error, 'P2002')) {
                const target = prismaErrorFields(error);

                if (target.includes('cedula')) {
                    throw new AppError('La cédula o RUC ya se encuentra registrada.', 409);
                }
                if (target.includes('email')) {
                    throw new AppError('El correo electrónico ya está registrado.', 409);
                }
                throw new AppError('Ya existe un cliente con esos datos.', 409);
            }
            if (isPrismaError(error, 'P2003')) {
                throw new AppError('La empresa indicada no existe.', 422);
            }
            throw new AppError('No fue posible registrar el cliente. Inténtalo nuevamente.', 500);
        }
    }
}
