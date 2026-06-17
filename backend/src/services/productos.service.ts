import { prisma } from '../config/database'; // O '../index' dependiendo de dónde exportes tu prisma

export class ProductosService {
    async crearProducto(socioId: string, data: any) {
        return await prisma.producto.create({
            data: {
                socioId: socioId,
                nombre: data.nombre,
                valor: data.valor,
                stock: data.stock || 0,
                descripcion: data.descripcion,
                imagenUrl: data.imagenUrl
            }
        });
    }

    async obtenerInventario(negocioId: string) {
        // Busca todos los productos de todos los socios que pertenezcan al mismo negocio
        return await prisma.producto.findMany({
            where: {
                socio: {
                    negocioId: negocioId
                }
            },
            orderBy: { creadoEn: 'desc' } // O el campo de fecha que tengas
        });
    }
}