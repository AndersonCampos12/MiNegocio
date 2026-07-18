import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api/productos';

@Injectable({ providedIn: 'root' })
export class ProductoService {
    constructor(private http: HttpClient) { }

    obtenerProductos(negocioId?: string, estado: 'activos' | 'desactivados' = 'activos'): Observable<any[]> {
        let params = new HttpParams();
        if (negocioId) {
            params = params.set('negocioId', negocioId);  // ← era socioId
        }
        params = params.set('_t', Date.now().toString());
        params = params.set('estado', estado);
        return this.http.get<any[]>(API, { params });
    }

    crearProducto(formData: FormData): Observable<any> {
        return this.http.post<any>(API, formData);
    }

    actualizarProducto(id: string, datos: any): Observable<any> {
        return this.http.put<any>(`${API}/${id}`, datos);
    }

    eliminarProducto(id: string, negocioId?: string): Observable<any> {
        let params = new HttpParams();
        if (negocioId) params = params.set('negocioId', negocioId);
        return this.http.delete<any>(`${API}/${id}`, { params });
    }

    reactivarProducto(id: string, negocioId?: string): Observable<any> {
        let params = new HttpParams();
        if (negocioId) params = params.set('negocioId', negocioId);
        return this.http.patch<any>(`${API}/${id}/reactivar`, {}, { params });
    }
}
