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
        const usuarioString = localStorage.getItem('usuario');
        let socioId = '';

        if (usuarioString) {
            socioId = JSON.parse(usuarioString).id;
        }

        return this.http.get(`${this.apiUrl}?socioId=${socioId}`);
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
