import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NegociosService {
    private apiUrl = 'http://localhost:3000/api/negocios';

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    obtenerTodos(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
    }

    crearEmpresaYAdmin(datos: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/crear-empresa`, datos, { headers: this.getHeaders() });
    }

    obtenerMiEmpresa(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/mi-empresa`, { headers: this.getHeaders() });
    }

    actualizarEmpresa(id: string, datos: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, datos, { headers: this.getHeaders() });
    }
}