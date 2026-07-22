import { prisma } from '../config/database';
import jwt from 'jsonwebtoken';

export class TiendaService {

    private firmarImagen(imagenUrl: string | null): string | null {
        if (!imagenUrl) return null;

        const filename = imagenUrl.split('/').pop();
        if (!filename) return imagenUrl;

        const firma = jwt.sign({ file: filename }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        return `/api/productos/ver-imagen/${filename}?firma=${firma}`;
    }

    async obtenerProductosTienda(slug?: string, clienteId?: string) {
        const where: any = {
            activo: true,
            negocio: {
                estado: 'ACTIVO'  // Solo negocios aprobados
            }
        };

        if (slug) {
            where.negocio.slug = slug;
        }
        if (clienteId) {
            where.negocio.clientes = {
                some: { clienteId, activo: true }
            };
        }

        // 1. Guardamos el resultado en una variable
        const productos = await prisma.producto.findMany({
            where,
            include: {
                negocio: {
                    select: {
                        id: true,
                        nombre: true,
                        slug: true
                    }
                }
            },
            orderBy: { creadoEn: 'desc' }
        });

        // 2. Mapeamos y aplicamos la firma antes de devolverlos
        return productos.map(prod => ({
            ...prod,
            imagenUrl: this.firmarImagen(prod.imagenUrl)
        }));
    }

    async obtenerNegociosActivos(clienteId?: string) {
        return prisma.negocio.findMany({
            where: {
                estado: 'ACTIVO',
                ...(clienteId ? { clientes: { some: { clienteId, activo: true } } } : {})
            },
            select: {
                id: true,
                nombre: true,
                slug: true
            },
            orderBy: { nombre: 'asc' }
        });
    }
}
