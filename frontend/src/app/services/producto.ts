import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProductoService {
    private apiUrl = 'http://localhost:3000/api/productos';

    constructor(private http: HttpClient) { }

    obtenerProductos(): Observable<any> {
        const usuarioString = localStorage.getItem('usuario');
        let socioId = '';
        if (usuarioString) {
            socioId = JSON.parse(usuarioString).id;
        }
        return this.http.get(`${this.apiUrl}?socioId=${socioId}`);
    }

    crearProducto(formData: FormData): Observable<any> {
        return this.http.post(this.apiUrl, formData);
    }

    // NUEVO: Método para actualizar
    actualizarProducto(id: string, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data);
    }

    // NUEVO: Método para hacer el borrado lógico
    eliminarProducto(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}