import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ClientesService {
    // Ajusta el puerto o la ruta base según tu entorno (environment)
    private apiUrl = 'http://localhost:3000/api/clientes';

    constructor(private http: HttpClient) { }

    buscarClientes(termino: string, negocioId: string) {
        const params = new HttpParams()
            .set('search', termino)
            .set('negocioId', negocioId);

        return this.http.get(`${this.apiUrl}/buscar`, { params });
    }

    crearCliente(cliente: any) {
        return this.http.post(`${this.apiUrl}`, cliente);
    }
}