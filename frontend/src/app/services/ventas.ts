import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root'
})
export class VentasService {
    private apiUrl = 'http://localhost:3000/api/ventas';
    private socket: Socket;
    private stockActualizado$ = new Subject<any>();

    constructor(private http: HttpClient) {
        // Conexión al servidor WebSocket de Express
        this.socket = io('http://localhost:3000');

        // Escucha eventos globales de stock modificados por otros terminales
        this.socket.on('stock:actualizado', (data) => {
            this.stockActualizado$.next(data);
        });
    }

    private getHeaders() {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    registrarVenta(payload: any) {
        // Ajusta la URL de tu API según tu configuración ('http://localhost:3000/api/ventas' etc.)
        return this.http.post(`${this.apiUrl}`, payload);
    }

    onStockActualizado(): Observable<any> {
        return this.stockActualizado$.asObservable();
    }
}