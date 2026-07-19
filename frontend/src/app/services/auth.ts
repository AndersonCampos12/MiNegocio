import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { SocketService } from './socket';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';

    // ✅ Estado reactivo del usuario
    private usuarioSubject = new BehaviorSubject<any>(this.getSocioActual());
    usuario$ = this.usuarioSubject.asObservable();

    constructor(private http: HttpClient, private socketService: SocketService) { }

    registrar(datos: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/registro`, datos);
    }

    registrarCliente(datos: any) {
        return this.http.post(`${this.apiUrl}/admin/registro`, datos);
    }

    verificarCuenta(email: string, codigo: string) {
        return this.http.post(`${this.apiUrl}/verificar`, { email, codigo });
    }

    reenviarCodigo(email: string) {
        return this.http.post(`${this.apiUrl}/reenviar-codigo`, { email });
    }

    solicitarRecuperacion(email: string) {
        return this.http.post(`${this.apiUrl}/solicitar-recuperacion`, { email });
    }

    restablecerPassword(email: string, codigo: string, password: string) {
        return this.http.post(`${this.apiUrl}/restablecer-password`, { email, codigo, password });
    }

    obtenerPerfil() {
        return this.http.get(`${this.apiUrl}/perfil`);
    }

    actualizarPerfil(datos: { nombre: string; cedula: string; email: string }) {
        return this.http.put(`${this.apiUrl}/perfil`, datos).pipe(
            tap((respuesta: any) => this.actualizarUsuarioLocal(respuesta.perfil))
        );
    }

    cambiarPassword(passwordActual: string, passwordNueva: string) {
        return this.http.put(`${this.apiUrl}/cambiar-password`, { passwordActual, passwordNueva });
    }

    actualizarUsuarioLocal(perfil: any) {
        const actual = this.getSocioActual() || {};
        const usuario = { ...actual, ...perfil };
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuarioSubject.next(usuario);
    }

    crearEmpresaAdmin(datos: any) {
        return this.http.post(`${this.apiUrl}/admin/crear-empresa`, datos);
    }

    login(email: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
            tap((respuesta: any) => {
                if (respuesta.token) {
                    localStorage.setItem('token', respuesta.token);
                    localStorage.setItem('usuario', JSON.stringify(respuesta.socio));
                    this.usuarioSubject.next(respuesta.socio); // ✅ notifica
                }
            })
        );
    }

    loginGoogle(tokenGoogle: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/google`, { token: tokenGoogle }).pipe(
            tap((res: any) => {
                localStorage.setItem('token', res.token);
                localStorage.setItem('usuario', JSON.stringify(res.socio)); // ✅ era res.usuario
                this.usuarioSubject.next(res.socio); // ✅ notifica
            })
        );
    }

    getSocioActual() {
        const raw = localStorage.getItem('usuario');
        return raw ? JSON.parse(raw) : null;
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        this.usuarioSubject.next(null); // ✅ limpia el estado
        this.socketService.desconectar();
    }

    getRole(): string | null {
        return this.usuarioSubject.getValue()?.rol || null;
    }
}
