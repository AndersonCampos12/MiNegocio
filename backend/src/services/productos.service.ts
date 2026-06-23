import { prisma } from '../config/database';
import jwt from 'jsonwebtoken';

export class ProductosService {

    // 🛡️ Helper para firmar las URLs
    private firmarImagen(imagenUrl: string | null): string | null {
        if (!imagenUrl) return null;

        // Extraemos solo el nombre del archivo (ej. "1781581951716-imagen.png")
        const filename = imagenUrl.split('/').pop();
        if (!filename) return imagenUrl;

        // Creamos una firma válida por 1 hora
        const firma = jwt.sign({ file: filename }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        // Devolvemos la nueva ruta apuntando a nuestro controlador protegido
        return `/api/productos/ver-imagen/${filename}?firma=${firma}`;
    }

    async obtenerProductos(negocioId: string) {
        const productos = await prisma.producto.findMany({
            where: { negocioId, activo: true },
            orderBy: { creadoEn: 'desc' }
        });

        // Mapeamos los productos para entregar la URL ya firmada
        return productos.map(prod => ({
            ...prod,
            imagenUrl: this.firmarImagen(prod.imagenUrl)
        }));
    }

    async crearProducto(negocioId: string, data: {
        nombre: string;
        valor: number;
        stock: number;
        descripcion?: string;
        imagenUrl?: string | null;
    }) {
        const nuevo = await prisma.producto.create({
            data: {
                negocioId,
                nombre: data.nombre,
                valor: data.valor,
                stock: data.stock,
                descripcion: data.descripcion,
                imagenUrl: data.imagenUrl // Guardamos /uploads/archivo.png en BD
            }
        });

        // Devolvemos el producto con la URL firmada para la vista instantánea
        return {
            ...nuevo,
            imagenUrl: this.firmarImagen(nuevo.imagenUrl)
        };
    }

    async actualizarProducto(id: string, data: any) {
        const actualizado = await prisma.producto.update({
            where: { id },
            data: {
                nombre: data.nombre,
                valor: parseFloat(data.valor),
                stock: parseInt(data.stock, 10),
                descripcion: data.descripcion
            }
        });

        return {
            ...actualizado,
            imagenUrl: this.firmarImagen(actualizado.imagenUrl)
        };
    }

    async desactivarProducto(id: string) {
        return prisma.producto.update({
            where: { id },
            data: { activo: false }
        });
    }
}