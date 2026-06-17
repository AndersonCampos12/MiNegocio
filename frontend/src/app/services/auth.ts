import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth'; // La ruta de tu backend

    constructor(private http: HttpClient) { }

    // 1. Registro de negocio y administrador
    registrar(datos: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/registro`, datos);
    }

    // 2. Login tradicional
    login(email: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
            tap((respuesta: any) => {
                // Si hay token, lo guardamos en el navegador
                if (respuesta.token) {
                    localStorage.setItem('token', respuesta.token);
                    localStorage.setItem('usuario', JSON.stringify(respuesta.socio));
                }
            })
        );
    }

    // 3. Login con Google (OAuth)
    loginGoogle(tokenGoogle: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/google`, { token: tokenGoogle }).pipe(
            tap((respuesta: any) => {
                if (respuesta.token) {
                    localStorage.setItem('token', respuesta.token);
                    localStorage.setItem('usuario', JSON.stringify(respuesta.socio));
                }
            })
        );
    }

    // Utilidades para verificar la sesión
    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
    }
}