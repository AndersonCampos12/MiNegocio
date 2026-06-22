import { prisma } from '../config/database';

export class ProductosService {

    // SUPERADMIN pasa negocioId de cualquier empresa
    // ADMIN/VENDEDOR/CAJERO pasan su propio negocioId
    async obtenerProductos(negocioId: string) {
        return prisma.producto.findMany({
            where: { negocioId, activo: true },
            orderBy: { creadoEn: 'desc' }
        });
    }

    async crearProducto(negocioId: string, data: {
        nombre: string;
        valor: number;
        stock: number;
        descripcion?: string;
        imagenUrl?: string | null;
    }) {
        return prisma.producto.create({
            data: {
                negocioId,
                nombre: data.nombre,
                valor: data.valor,
                stock: data.stock,
                descripcion: data.descripcion,
                imagenUrl: data.imagenUrl
            }
        });
    }

    async actualizarProducto(id: string, data: any) {
        return prisma.producto.update({
            where: { id },
            data: {
                nombre: data.nombre,
                valor: parseFloat(data.valor),
                stock: parseInt(data.stock, 10),
                descripcion: data.descripcion
            }
        });
    }

    async desactivarProducto(id: string) {
        return prisma.producto.update({
            where: { id },
            data: { activo: false }
        });
    }
}