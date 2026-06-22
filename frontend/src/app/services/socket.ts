import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket | undefined;

    // Se llama al hacer Login
    conectar() {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Limpiar conexión vieja si existe
        this.desconectar();

        // Iniciamos conexión enviando el JWT
        this.socket = io('http://localhost:3000', {
            auth: { token }
        });

        this.socket.on('connect', () => {
            console.log('✅ WebSocket Global Conectado:', this.socket?.id);
        });

        this.socket.on('connect_error', (err) => {
            console.error('❌ WebSocket Error:', err.message);
        });
    }

    // Se llama al hacer Logout
    desconectar() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = undefined;
            console.log('🔌 WebSocket Global Desconectado');
        }
    }

    // Método para que ventas.service.ts pueda acceder al socket
    getSocket(): Socket | undefined {
        return this.socket;
    }
}