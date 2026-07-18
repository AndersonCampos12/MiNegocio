import { prisma } from '../config/database';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/app.error';

export class ProductosService {

    private validarDatos(data: any) {
        const nombre = typeof data.nombre === 'string' ? data.nombre.trim() : '';
        const descripcion = typeof data.descripcion === 'string' ? data.descripcion.trim() : '';
        const valor = Number(data.valor);
        const stock = Number(data.stock);

        if (!nombre) throw new AppError('El nombre del producto es obligatorio.');
        if (nombre.length > 120) throw new AppError('El nombre no puede superar los 120 caracteres.');
        if (!Number.isFinite(valor) || valor <= 0) throw new AppError('El precio debe ser mayor a cero.');
        if (!Number.isInteger(stock) || stock < 0) throw new AppError('El stock debe ser un entero igual o mayor a cero.');
        if (descripcion.length > 500) throw new AppError('La descripción no puede superar los 500 caracteres.');

        return { nombre, descripcion: descripcion || null, valor, stock };
    }

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

    async obtenerProductos(negocioId: string, activo = true) {
        const productos = await prisma.producto.findMany({
            where: { negocioId, activo },
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
        const datosValidos = this.validarDatos(data);
        const nuevo = await prisma.producto.create({
            data: {
                negocioId,
                ...datosValidos,
                imagenUrl: data.imagenUrl // Guardamos /uploads/archivo.png en BD
            }
        });

        // Devolvemos el producto con la URL firmada para la vista instantánea
        return {
            ...nuevo,
            imagenUrl: this.firmarImagen(nuevo.imagenUrl)
        };
    }

    async actualizarProducto(id: string, negocioId: string, data: any) {
        const datosValidos = this.validarDatos(data);
        const producto = await prisma.producto.findFirst({ where: { id, negocioId, activo: true } });
        if (!producto) throw new AppError('Producto no encontrado.', 404);

        const actualizado = await prisma.producto.update({
            where: { id: producto.id },
            data: {
                ...datosValidos
            }
        });

        return {
            ...actualizado,
            imagenUrl: this.firmarImagen(actualizado.imagenUrl)
        };
    }

    async desactivarProducto(id: string, negocioId: string) {
        const producto = await prisma.producto.findFirst({ where: { id, negocioId, activo: true } });
        if (!producto) throw new AppError('Producto no encontrado.', 404);
        return prisma.producto.update({
            where: { id: producto.id },
            data: { activo: false }
        });
    }

    async reactivarProducto(id: string, negocioId: string) {
        const producto = await prisma.producto.findFirst({ where: { id, negocioId, activo: false } });
        if (!producto) throw new AppError('Producto desactivado no encontrado.', 404);
        const actualizado = await prisma.producto.update({
            where: { id: producto.id },
            data: { activo: true }
        });
        return { ...actualizado, imagenUrl: this.firmarImagen(actualizado.imagenUrl) };
    }
}
