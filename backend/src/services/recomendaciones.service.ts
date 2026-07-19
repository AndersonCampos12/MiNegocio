import { prisma } from '../config/database';

interface ProductoCandidato {
    id: string;
    nombre: string;
    valor: number;
    stock: number;
    cantidadVendida: number;
}

interface Recomendacion extends ProductoCandidato {
    motivo: string;
}

interface RespuestaOllama {
    message?: { content?: string };
}

export class RecomendacionesService {
    private readonly ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    private readonly modelo = process.env.OLLAMA_MODEL || 'llama3.2:3b';

    async obtener(negocioId: string, dias = 30, limite = 5) {
        const desde = new Date();
        desde.setDate(desde.getDate() - dias);

        const ventasPorProducto = await prisma.detalleVenta.groupBy({
            by: ['productoId'],
            where: {
                venta: {
                    negocioId,
                    creadoEn: { gte: desde }
                }
            },
            _sum: { cantidad: true }
        });

        const cantidades = new Map(
            ventasPorProducto.map(item => [item.productoId, item._sum.cantidad || 0])
        );
        const ids = [...cantidades.keys()];

        if (ids.length === 0) {
            return {
                recomendaciones: [],
                fuente: 'ranking',
                mensaje: `Todavia no hay ventas registradas en los ultimos ${dias} dias.`
            };
        }

        const productos = await prisma.producto.findMany({
            where: {
                id: { in: ids },
                negocioId,
                activo: true,
                stock: { gt: 0 }
            },
            select: { id: true, nombre: true, valor: true, stock: true }
        });

        const candidatos: ProductoCandidato[] = productos
            .map(producto => ({
                id: producto.id,
                nombre: producto.nombre,
                valor: Number(producto.valor),
                stock: producto.stock,
                cantidadVendida: cantidades.get(producto.id) || 0
            }))
            .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
            .slice(0, 15);

        const fallback = candidatos.slice(0, limite).map(producto => ({
            ...producto,
            motivo: `${producto.cantidadVendida} unidades vendidas en los ultimos ${dias} dias y stock disponible.`
        }));

        if (candidatos.length === 0) {
            return {
                recomendaciones: [],
                fuente: 'ranking',
                mensaje: 'Los productos vendidos actualmente no tienen stock disponible.'
            };
        }

        try {
            const recomendaciones = await this.consultarOllama(candidatos, limite, dias);
            return {
                recomendaciones,
                fuente: 'ollama',
                modelo: this.modelo,
                mensaje: 'Recomendaciones generadas con ventas reales y Ollama.'
            };
        } catch (error) {
            console.warn('Ollama no disponible; se utilizara el ranking de ventas:', error);
            return {
                recomendaciones: fallback,
                fuente: 'ranking',
                mensaje: 'Ollama no esta disponible. Se muestra el ranking calculado con ventas reales.'
            };
        }
    }

    private async consultarOllama(candidatos: ProductoCandidato[], limite: number, dias: number): Promise<Recomendacion[]> {
        const formato = {
            type: 'object',
            properties: {
                recomendaciones: {
                    type: 'array',
                    maxItems: limite,
                    items: {
                        type: 'object',
                        properties: {
                            productoId: { type: 'string' },
                            motivo: { type: 'string' }
                        },
                        required: ['productoId', 'motivo']
                    }
                }
            },
            required: ['recomendaciones']
        };

        const response = await fetch(`${this.ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(20_000),
            body: JSON.stringify({
                model: this.modelo,
                stream: false,
                format: formato,
                options: { temperature: 0 },
                messages: [{
                    role: 'user',
                    content: [
                        `Elige hasta ${limite} productos para recomendar usando ventas de los ultimos ${dias} dias.`,
                        'Prioriza cantidad vendida y stock disponible.',
                        'No inventes productos, identificadores ni cifras. Devuelve solo productos de esta lista:',
                        JSON.stringify(candidatos)
                    ].join('\n')
                }]
            })
        });

        if (!response.ok) throw new Error(`Ollama respondio con HTTP ${response.status}`);

        const data = await response.json() as RespuestaOllama;
        if (!data.message?.content) throw new Error('Ollama devolvio una respuesta vacia');

        const resultado = JSON.parse(data.message.content) as {
            recomendaciones?: Array<{ productoId?: unknown; motivo?: unknown }>;
        };
        if (!Array.isArray(resultado.recomendaciones)) throw new Error('Formato de Ollama invalido');

        const porId = new Map(candidatos.map(producto => [producto.id, producto]));
        const usados = new Set<string>();

        const recomendaciones = resultado.recomendaciones.flatMap(item => {
            if (typeof item.productoId !== 'string' || typeof item.motivo !== 'string') return [];
            const producto = porId.get(item.productoId);
            if (!producto || usados.has(producto.id)) return [];
            usados.add(producto.id);
            return [{ ...producto, motivo: item.motivo.slice(0, 240) }];
        }).slice(0, limite);

        if (recomendaciones.length === 0) throw new Error('Ollama no selecciono productos validos');
        return recomendaciones;
    }
}
