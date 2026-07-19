interface RespuestaPaypal {
    id: string;
    status: string;
    links?: { href: string; rel: string }[];
    purchase_units?: any[];
}

export class PaypalService {
    private baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    private async token() {
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const secret = process.env.PAYPAL_CLIENT_SECRET;
        if (!clientId || !secret) throw new Error('PayPal no está configurado.');

        const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        const data = await response.json() as any;
        if (!response.ok || !data.access_token) throw new Error('No se pudo autenticar con PayPal.');
        return data.access_token as string;
    }

    private async solicitar(path: string, method: 'GET' | 'POST', body?: object, requestId?: string) {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${await this.token()}`,
                'Content-Type': 'application/json',
                Prefer: 'return=representation',
                ...(requestId ? { 'PayPal-Request-Id': requestId } : {})
            },
            body: body ? JSON.stringify(body) : undefined
        });
        const data = await response.json() as RespuestaPaypal;
        if (!response.ok) throw new Error('PayPal rechazó la operación.');
        return data;
    }

    crearOrden(pedido: { id: string; total: unknown; moneda: string }) {
        return this.solicitar('/v2/checkout/orders', 'POST', {
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: pedido.id,
                custom_id: pedido.id,
                amount: { currency_code: pedido.moneda, value: Number(pedido.total).toFixed(2) }
            }],
            application_context: {
                return_url: `${process.env.FRONTEND_URL}/tienda?paypal=aprobado`,
                cancel_url: `${process.env.FRONTEND_URL}/tienda?paypal=cancelado`,
                user_action: 'PAY_NOW'
            }
        }, `crear-${pedido.id}`);
    }

    capturarOrden(orderId: string, pedidoId: string) {
        return this.solicitar(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, 'POST', {}, `capturar-${pedidoId}`);
    }
}
