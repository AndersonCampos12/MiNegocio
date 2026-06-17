import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProductoService {
    private apiUrl = 'http://localhost:3000/api/productos';

    constructor(private http: HttpClient) { }

    // 1. Método ajustado para usar el ID del socio
    obtenerProductos(): Observable<any> {
        const usuarioString = localStorage.getItem('usuario');
        let socioId = '';

        if (usuarioString) {
            const usuario = JSON.parse(usuarioString);
            // Usamos el 'id' del usuario, que sabemos con certeza que existe
            socioId = usuario.id;
        }

        // Le mandamos el socioId por la URL
        return this.http.get(`${this.apiUrl}?socioId=${socioId}`);
    }

    // 2. Método para enviar la imagen y los textos
    crearProducto(formData: FormData): Observable<any> {
        return this.http.post(this.apiUrl, formData);
    }
}