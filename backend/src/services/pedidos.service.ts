import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

interface ItemCarrito {
    productoId: string;
    cantidad: number;
}

export class PedidosService {
    async crearDesdeCarrito(clienteId: string, items: ItemCarrito[]) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('El carrito está vacío.');
        }

        const cantidades = new Map<string, number>();
        for (const item of items) {
            if (!item?.productoId || !Number.isInteger(item.cantidad) || item.cantidad <= 0) {
                throw new Error('El carrito contiene cantidades inválidas.');
            }
            cantidades.set(item.productoId, (cantidades.get(item.productoId) || 0) + item.cantidad);
        }

        const cliente = await prisma.socio.findFirst({
            where: { id: clienteId, rol: 'CLIENTE', cuentaActivada: true },
            select: { id: true }
        });
        if (!cliente) throw new Error('El cliente no existe o su cuenta no está activa.');

        const productos = await prisma.producto.findMany({
            where: { id: { in: [...cantidades.keys()] }, activo: true },
            select: { id: true, negocioId: true, nombre: true, valor: true, stock: true }
        });
        if (productos.length !== cantidades.size) {
            throw new Error('Uno o más productos no existen o ya no están disponibles.');
        }

        const grupos = new Map<string, typeof productos>();
        for (const producto of productos) {
            const cantidad = cantidades.get(producto.id)!;
            if (producto.stock < cantidad) throw new Error(`Stock insuficiente para ${producto.nombre}.`);
            grupos.set(producto.negocioId, [...(grupos.get(producto.negocioId) || []), producto]);
        }

        return prisma.$transaction(async (tx) => {
            const pedidos = [];
            for (const [negocioId, productosNegocio] of grupos) {
                const subtotal = productosNegocio.reduce(
                    (total, producto) => total.plus(producto.valor.mul(cantidades.get(producto.id)!)),
                    new Prisma.Decimal(0)
                );
                const impuestos = subtotal.mul(new Prisma.Decimal('0.15')).toDecimalPlaces(2);
                const total = subtotal.plus(impuestos);

                const pedido = await tx.pedido.create({
                    data: {
                        negocioId,
                        clienteId,
                        subtotal,
                        impuestos,
                        total,
                        expiraEn: new Date(Date.now() + 30 * 60 * 1000),
                        detalles: {
                            create: productosNegocio.map(producto => {
                                const cantidad = cantidades.get(producto.id)!;
                                return {
                                    productoId: producto.id,
                                    cantidad,
                                    nombreProducto: producto.nombre,
                                    precioUnit: producto.valor,
                                    subtotal: producto.valor.mul(cantidad)
                                };
                            })
                        }
                    },
                    include: { negocio: { select: { nombre: true } }, detalles: true }
                });
                pedidos.push(pedido);
            }
            return pedidos;
        });
    }

    listarDelCliente(clienteId: string) {
        return prisma.pedido.findMany({
            where: { clienteId },
            include: { negocio: { select: { nombre: true } }, detalles: true, venta: { select: { id: true } } },
            orderBy: { creadoEn: 'desc' }
        });
    }

    async cancelar(pedidoId: string, clienteId: string) {
        const resultado = await prisma.pedido.updateMany({
            where: { id: pedidoId, clienteId, estado: 'PENDIENTE_PAGO' },
            data: { estado: 'CANCELADO', canceladoEn: new Date() }
        });
        if (resultado.count !== 1) {
            throw new Error('El pedido no existe o ya no puede cancelarse.');
        }
        return { mensaje: 'Pedido cancelado correctamente.' };
    }
}
