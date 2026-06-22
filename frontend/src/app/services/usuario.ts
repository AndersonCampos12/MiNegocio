import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api/usuarios';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
    constructor(private http: HttpClient) { }

    obtenerUsuarios(): Observable<any[]> {
        return this.http.get<any[]>(API);
    }

    crearUsuario(data: any): Observable<any> {
        return this.http.post<any>(API, data);
    }

    actualizarUsuario(id: string, data: any): Observable<any> {
        return this.http.put<any>(`${API}/${id}`, data);
    }

    eliminarUsuario(id: string): Observable<any> {
        return this.http.delete<any>(`${API}/${id}`);
    }
}