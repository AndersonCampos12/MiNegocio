import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SocketService } from './socket'; // <-- NUEVO IMPORT

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth'; // La ruta de tu backend

    constructor(private http: HttpClient, private socketService: SocketService) { }

    // 1. Registro de negocio y administrador
    registrar(datos: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/registro`, datos);
    }

    // NUEVO: Registro exclusivo para clientes
    registrarCliente(datos: any) {
        // Apuntamos al nuevo endpoint público que configuramos en auth.routes.ts
        return this.http.post(`${this.apiUrl}/cliente/registro`, datos);
    }

    // DE PASO: Actualiza tu antiguo método de registro para que quede para el SuperAdmin
    crearEmpresaAdmin(datos: any) {
        return this.http.post(`${this.apiUrl}/admin/crear-empresa`, datos);
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
        // Enviamos el token de Google a tu ruta recién creada
        return this.http.post(`${this.apiUrl}/google`, { token: tokenGoogle }).pipe(
            // Usamos 'tap' para guardar el token en localStorage silenciosamente antes de que el componente reaccione
            tap((res: any) => {
                localStorage.setItem('token', res.token);
                localStorage.setItem('usuario', JSON.stringify(res.usuario));
            })
        );
    }

    getSocioActual() {
        const raw = localStorage.getItem('usuario');
        return raw ? JSON.parse(raw) : null;
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

        // 🔥 ¡AQUÍ MUERE EL SOCKET! Desconectamos limpiamente
        this.socketService.desconectar();
    }

    getRole(): string | null {
        const usuarioStr = localStorage.getItem('usuario');
        if (!usuarioStr) return null;

        try {
            const usuario = JSON.parse(usuarioStr);
            return usuario.rol || null;
        } catch (error) {
            console.error('Error al parsear el usuario del localStorage', error);
            return null;
        }
    }
}