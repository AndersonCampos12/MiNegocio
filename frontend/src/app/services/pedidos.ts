import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PedidosService {
    private apiPedidos = 'http://localhost:3000/api/pedidos';
    private apiPagos = 'http://localhost:3000/api/pagos';

    constructor(private http: HttpClient) { }

    crear(items: { productoId: string; cantidad: number }[]) {
        return this.http.post<any[]>(this.apiPedidos, { items });
    }

    cancelar(pedidoId: string) {
        return this.http.delete<{ mensaje: string }>(`${this.apiPedidos}/${pedidoId}`);
    }

    iniciarPago(pedidoId: string, proveedor: 'PAYPAL' | 'PAYPHONE') {
        return this.http.post<any>(`${this.apiPagos}/${pedidoId}/iniciar`, { proveedor });
    }

    capturarPaypal(pedidoId: string, orderId: string) {
        return this.http.post<any>(`${this.apiPagos}/paypal/${pedidoId}/capturar`, { orderId });
    }

    confirmarPayphone(pedidoId: string, id: number, clientTransactionId: string) {
        return this.http.post<any>(`${this.apiPagos}/payphone/${pedidoId}/confirmar`, {
            id,
            clientTransactionId
        });
    }
}
