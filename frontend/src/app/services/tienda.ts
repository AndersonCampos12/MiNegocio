import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api/tienda';

@Injectable({ providedIn: 'root' })
export class TiendaService {
    constructor(private http: HttpClient) { }

    obtenerProductos(negocioSlug?: string): Observable<any[]> {
        let params = new HttpParams();
        if (negocioSlug) {
            params = params.set('negocio', negocioSlug);
        }
        return this.http.get<any[]>(`${API}/productos`, { params });
    }

    obtenerNegocios(): Observable<any[]> {
        return this.http.get<any[]>(`${API}/negocios`);
    }
}