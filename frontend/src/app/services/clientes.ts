import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ClientesService {
    // Ajusta el puerto o la ruta base según tu entorno (environment)
    private apiUrl = 'http://localhost:3000/api/clientes';

    constructor(private http: HttpClient) { }

    buscarClientes(termino: string, negocioId?: string) {
        let params = new HttpParams().set('search', termino);
        if (negocioId) params = params.set('negocioId', negocioId);

        return this.http.get(`${this.apiUrl}/buscar`, { params });
    }

    crearCliente(cliente: any, negocioId?: string) {
        return this.http.post(`${this.apiUrl}`, { ...cliente, ...(negocioId ? { negocioId } : {}) });
    }

    obtenerClientes(estado: 'activos' | 'inactivos' | 'todos' = 'activos', negocioId?: string) {
        let params = new HttpParams().set('estado', estado);
        if (negocioId) params = params.set('negocioId', negocioId);
        return this.http.get<any[]>(this.apiUrl, { params });
    }

    actualizarCliente(membresiaId: string, datos: { nombre: string; email: string; cuentaActivada: boolean; password?: string }, negocioId?: string) {
        let params = new HttpParams();
        if (negocioId) params = params.set('negocioId', negocioId);
        return this.http.put(`${this.apiUrl}/${membresiaId}`, datos, { params });
    }

    cambiarEstado(membresiaId: string, activo: boolean, negocioId?: string) {
        let params = new HttpParams();
        if (negocioId) params = params.set('negocioId', negocioId);
        return this.http.patch(`${this.apiUrl}/${membresiaId}/estado`, { activo }, { params });
    }
}
