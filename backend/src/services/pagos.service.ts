import { Server } from 'socket.io';
import { prisma } from '../config/database';
import { StockInsuficienteError } from '../errors/app.error';
import { PaypalService } from './pagos/paypal.service';
import { PayphoneService } from './pagos/payphone.service';

export class PagosService {
    private paypal = new PaypalService();
    private payphone = new PayphoneService();

    constructor(private io: Server) { }

    private async obtenerPedido(pedidoId: string, clienteId?: string) {
        const pedido = await prisma.pedido.findFirst({
            where: { id: pedidoId, ...(clienteId ? { clienteId } : {}) },
            include: { detalles: true, venta: true }
        });
        if (!pedido) throw new Error('Pedido no encontrado.');
        return pedido;
    }

    async iniciar(pedidoId: string, clienteId: string, proveedor: 'PAYPAL' | 'PAYPHONE') {
        const pedido = await this.obtenerPedido(pedidoId, clienteId);
        if (pedido.estado !== 'PENDIENTE_PAGO') throw new Error('El pedido ya no está pendiente de pago.');
        if (pedido.expiraEn && pedido.expiraEn < new Date()) throw new Error('El pedido ha expirado.');
        if (pedido.referenciaOrdenPago) throw new Error('Este pedido ya tiene un pago iniciado.');

        if (proveedor === 'PAYPAL') {
            const orden = await this.paypal.crearOrden(pedido);
            const url = orden.links?.find(link => link.rel === 'approve')?.href;
            if (!url) throw new Error('PayPal no devolvió la URL de aprobación.');
            await prisma.pedido.update({
                where: { id: pedido.id },
                data: { proveedorPago: 'PAYPAL', referenciaOrdenPago: orden.id }
            });
            return { pedidoId: pedido.id, proveedor, url, referencia: orden.id };
        }

        const preparacion = await this.payphone.preparar(pedido);
        const url = preparacion.payWithPayPhone || preparacion.payWithCard;
        if (!url) throw new Error('PayPhone no devolvió la URL de pago.');
        await prisma.pedido.update({
            where: { id: pedido.id },
            data: { proveedorPago: 'PAYPHONE', referenciaOrdenPago: preparacion.clientTransactionId }
        });
        return { pedidoId: pedido.id, proveedor, url, referencia: preparacion.clientTransactionId };
    }

    async confirmarPaypal(pedidoId: string, clienteId: string, orderId: string) {
        const pedido = await this.obtenerPedido(pedidoId, clienteId);
        if (pedido.estado === 'PAGADO') return pedido.venta;
        if (pedido.proveedorPago !== 'PAYPAL' || pedido.referenciaOrdenPago !== orderId) {
            throw new Error('La orden de PayPal no corresponde al pedido.');
        }

        const captura = await this.paypal.capturarOrden(orderId, pedido.id);
        const pago = captura.purchase_units?.[0]?.payments?.captures?.[0];
        if (captura.status !== 'COMPLETED' || pago?.status !== 'COMPLETED') {
            throw new Error('PayPal todavía no confirma el pago.');
        }
        if (pago.amount?.currency_code !== pedido.moneda || pago.amount?.value !== Number(pedido.total).toFixed(2)) {
            throw new Error('El monto confirmado por PayPal no coincide con el pedido.');
        }
        return this.confirmarPedido(pedido.id, String(pago.id), 'PAYPAL');
    }

    async confirmarPayphone(pedidoId: string, id: number, clientTransactionId: string, clienteId?: string) {
        const pedido = await this.obtenerPedido(pedidoId, clienteId);
        if (pedido.estado === 'PAGADO') return pedido.venta;
        if (pedido.proveedorPago !== 'PAYPHONE' || pedido.referenciaOrdenPago !== clientTransactionId) {
            throw new Error('La transacción de PayPhone no corresponde al pedido.');
        }

        const confirmacion = await this.payphone.confirmar(id, clientTransactionId);
        if (confirmacion.statusCode !== 3 || confirmacion.transactionStatus !== 'Approved') {
            throw new Error('PayPhone no confirmó el pago.');
        }
        if (confirmacion.currency !== pedido.moneda || Number(confirmacion.amount) !== Math.round(Number(pedido.total) * 100)) {
            throw new Error('El monto confirmado por PayPhone no coincide con el pedido.');
        }
        return this.confirmarPedido(pedido.id, String(confirmacion.transactionId), 'PAYPHONE');
    }

    async confirmarNotificacionPayphone(data: any) {
        const clientTransactionId = String(data.ClientTransactionId || data.clientTransactionId || '');
        const transactionId = Number(data.TransactionId || data.transactionId);
        if (!clientTransactionId || !Number.isInteger(transactionId)) throw new Error('Notificación incompleta.');
        const pedido = await prisma.pedido.findFirst({
            where: { proveedorPago: 'PAYPHONE', referenciaOrdenPago: clientTransactionId },
            select: { id: true }
        });
        if (!pedido) throw new Error('Pedido no encontrado.');
        return this.confirmarPayphone(pedido.id, transactionId, clientTransactionId);
    }

    private async confirmarPedido(pedidoId: string, referenciaPago: string, metodoPago: 'PAYPAL' | 'PAYPHONE') {
        const resultado = await prisma.$transaction(async (tx) => {
            const actualizado = await tx.pedido.updateMany({
                where: { id: pedidoId, estado: 'PENDIENTE_PAGO' },
                data: { estado: 'PAGADO', pagadoEn: new Date(), referenciaPago }
            });

            if (actualizado.count === 0) {
                const existente = await tx.pedido.findUnique({ where: { id: pedidoId }, include: { venta: true } });
                if (existente?.estado === 'PAGADO' && existente.venta) return { venta: existente.venta, stock: [] };
                throw new Error('El pedido ya no puede confirmarse.');
            }

            const pedido = await tx.pedido.findUniqueOrThrow({
                where: { id: pedidoId },
                include: { detalles: true, cliente: { select: { nombre: true, email: true } } }
            });

            const stock = [];
            for (const item of pedido.detalles) {
                const descuento = await tx.producto.updateMany({
                    where: { id: item.productoId, negocioId: pedido.negocioId, activo: true, stock: { gte: item.cantidad } },
                    data: { stock: { decrement: item.cantidad } }
                });
                if (descuento.count !== 1) throw new StockInsuficienteError(item.nombreProducto);
                const producto = await tx.producto.findUniqueOrThrow({ where: { id: item.productoId }, select: { stock: true } });
                stock.push({ productoId: item.productoId, nuevoStock: producto.stock });
            }

            await tx.clienteNegocio.upsert({
                where: { clienteId_negocioId: { clienteId: pedido.clienteId, negocioId: pedido.negocioId } },
                update: { activo: true },
                create: {
                    clienteId: pedido.clienteId,
                    negocioId: pedido.negocioId,
                    nombreReferencia: pedido.cliente.nombre,
                    emailContacto: pedido.cliente.email
                }
            });

            const venta = await tx.venta.create({
                data: {
                    negocioId: pedido.negocioId,
                    clienteId: pedido.clienteId,
                    pedidoId: pedido.id,
                    metodoPago,
                    subtotal: pedido.subtotal,
                    impuestos: pedido.impuestos,
                    total: pedido.total,
                    detalles: {
                        create: pedido.detalles.map(item => ({
                            productoId: item.productoId,
                            cantidad: item.cantidad,
                            precioUnit: item.precioUnit
                        }))
                    }
                }
            });
            return { venta, stock };
        });

        for (const item of resultado.stock) {
            this.io.to((resultado.venta as any).negocioId).emit('stock:actualizado', item);
        }
        this.io.to((resultado.venta as any).negocioId).emit('venta:registrada', {
            ticket: resultado.venta.id.split('-')[0].toUpperCase(),
            total: Number(resultado.venta.total),
            metodoPago
        });
        return resultado.venta;
    }
}
