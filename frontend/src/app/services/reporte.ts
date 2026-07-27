import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReporteService {
    private apiUrl = 'http://localhost:3000/api/reportes';

    constructor(private http: HttpClient) { }

    obtenerMetricas(): Observable<any> {
        return this.http.get(this.apiUrl);
    }

    obtenerRecomendaciones(dias = 30, limite = 5): Observable<any> {
        return this.http.post('http://localhost:3000/api/recomendaciones', { dias, limite });
    }

    enviarFacturaPorCorreo(ventaId: string): Observable<{ mensaje: string; idCorreo: string }> {
        return this.http.post<{ mensaje: string; idCorreo: string }>(
            `${this.apiUrl}/factura/${ventaId}/enviar`,
            {}
        );
    }

    descargarFacturaPdf(ventaId: string): Observable<Blob> {
        return this.http.get(
            `${this.apiUrl}/factura/${ventaId}/pdf?estilo=moderno`,
            { responseType: 'blob' }
        );
    }
}
