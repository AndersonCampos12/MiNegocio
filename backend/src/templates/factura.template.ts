interface VentaFactura {
    id: string;
    creadoEn: Date;
    metodoPago: string;
    subtotal: unknown;
    impuestos: unknown;
    total: unknown;
    cliente: { nombre: string } | null;
    socio: { nombre: string } | null;
    detalles: Array<{
        cantidad: number;
        precioUnit: unknown;
        producto: { nombre: string };
    }>;
}

interface OpcionesFactura {
    autoImprimir?: boolean;
    estiloModerno?: boolean;
}

export function generarHtmlFactura(
    venta: VentaFactura,
    opciones: OpcionesFactura = {}
): string {
    const scriptImpresion = opciones.autoImprimir
        ? `
            <script>
                // Dispara el diálogo de impresión automáticamente y cierra la pestaña al terminar
                window.onload = function() {
                    window.print();
                    // Opcional: descomenta la siguiente línea si quieres que la pestaña se cierre sola
                    // window.onafterprint = function() { window.close(); }
                }
            </script>`
        : '';
    const estilosModernos = opciones.estiloModerno
        ? `
                * { box-sizing: border-box; }
                html { background: #e2e8f0; }
                body {
                    font-family: Arial, Helvetica, sans-serif;
                    width: 320px;
                    min-height: 100%;
                    margin: 0 auto;
                    padding: 26px 22px 22px;
                    color: #1e293b;
                    background: #ffffff;
                    border-top: 6px solid #2563eb;
                    font-size: 12px;
                }
                h2 { color: #0f172a; font-size: 20px; letter-spacing: -0.4px; }
                .subtitulo { color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; }
                .linea { border-color: #cbd5e1; margin: 16px 0; }
                .datos-factura p { margin: 7px 0; display: flex; justify-content: space-between; gap: 12px; }
                .datos-factura .bold { color: #64748b; font-weight: 600; }
                table { margin: 14px 0; }
                thead tr { border-bottom: 2px solid #2563eb !important; }
                th { color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; padding: 7px 0; }
                td { padding: 7px 0; }
                .totales { background: #f8fafc; border-radius: 10px; padding: 8px 12px; }
                .totales table { margin: 0; }
                .total-final td { color: #0f172a; border-top: 1px solid #cbd5e1; }
                .agradecimiento { color: #2563eb; margin: 18px 0 4px; }
            `
        : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Ticket #${venta.id.split('-')[0]}</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace;
                    width: 300px; /* Ancho estándar de ticketera térmica de 80mm */
                    margin: 0 auto;
                    padding: 10px;
                    font-size: 12px;
                    color: #000;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .linea { border-bottom: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { padding: 4px 0; }
                .bold { font-weight: bold; }
                ${estilosModernos}
            </style>
        </head>
        <body>
            <h2 class="text-center" style="margin-bottom: 5px;">TU NEGOCIO</h2>
            <p class="text-center subtitulo" style="margin-top: 0; font-size: 10px;">Comprobante de Venta</p>

            <div class="linea"></div>

            <div class="datos-factura">
                <p><span class="bold">Ticket</span> <span>${venta.id.split('-')[0].toUpperCase()}</span></p>
                <p><span class="bold">Fecha</span> <span>${new Date(venta.creadoEn).toLocaleString()}</span></p>
                <p><span class="bold">Cliente</span> <span>${venta.cliente?.nombre || 'Consumidor Final'}</span></p>
                <p><span class="bold">Cajero</span> <span>${venta.socio?.nombre || 'Caja Principal'}</span></p>
                <p><span class="bold">Método</span> <span>${venta.metodoPago}</span></p>
            </div>

            <div class="linea"></div>

            <table>
                <thead>
                    <tr style="border-bottom: 1px solid #000;">
                        <th class="text-left">Cant</th>
                        <th class="text-left">Descripción</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${venta.detalles.map(d => `
                        <tr>
                            <td class="text-left" style="vertical-align: top;">${d.cantidad}</td>
                            <td class="text-left" style="padding-right: 5px;">${d.producto.nombre}</td>
                            <td class="text-right" style="vertical-align: top;">$${(d.cantidad * Number(d.precioUnit)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="linea"></div>

            <div class="totales">
            <table style="font-size: 13px;">
                <tr>
                    <td class="text-right">Subtotal:</td>
                    <td class="text-right">$${Number(venta.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                    <td class="text-right">IVA (15%):</td>
                    <td class="text-right">$${Number(venta.impuestos).toFixed(2)}</td>
                </tr>
                <tr class="bold total-final" style="font-size: 15px;">
                    <td class="text-right" style="padding-top: 8px;">TOTAL:</td>
                    <td class="text-right" style="padding-top: 8px;">$${Number(venta.total).toFixed(2)}</td>
                </tr>
            </table>
            </div>

            <div class="linea" style="margin-top: 15px;"></div>
            <p class="text-center bold agradecimiento">¡Gracias por su compra!</p>
            ${scriptImpresion}
        </body>
        </html>
    `;
}
