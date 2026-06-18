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
}