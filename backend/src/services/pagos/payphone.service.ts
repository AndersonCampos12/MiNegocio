export class PayphoneService {
    private baseUrl = process.env.PAYPHONE_BASE_URL || 'https://pay.payphonetodoesposible.com';

    private async solicitar(path: string, body: object) {
        const token = process.env.PAYPHONE_TOKEN;
        if (!token) throw new Error('PayPhone no está configurado.');
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json() as any;
        if (!response.ok) throw new Error('PayPhone rechazó la operación.');
        return data;
    }

    preparar(pedido: { id: string; subtotal: unknown; impuestos: unknown; total: unknown; moneda: string }) {
        const storeId = process.env.PAYPHONE_STORE_ID;
        if (!storeId) throw new Error('Falta configurar PAYPHONE_STORE_ID.');
        const clientTransactionId = pedido.id.replace(/-/g, '').slice(0, 15).toUpperCase();
        return this.solicitar('/api/button/Prepare', {
            amount: Math.round(Number(pedido.total) * 100),
            amountWithTax: Math.round(Number(pedido.subtotal) * 100),
            tax: Math.round(Number(pedido.impuestos) * 100),
            clientTransactionId,
            reference: `Pedido ${pedido.id.slice(0, 8)}`,
            storeId,
            currency: pedido.moneda,
            responseUrl: `${process.env.FRONTEND_URL}/tienda?payphone=confirmar`,
            cancellationUrl: `${process.env.FRONTEND_URL}/tienda?payphone=cancelado`,
            timeZone: -5
        }).then(data => ({ ...data, clientTransactionId }));
    }

    confirmar(id: number, clientTxId: string) {
        return this.solicitar('/api/button/V2/Confirm', { id, clientTxId });
    }
}
