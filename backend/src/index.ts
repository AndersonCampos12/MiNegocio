import express from 'express';
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import jwt from 'jsonwebtoken'; // <-- NUEVO IMPORT REQUERIDO
import authRoutes from './routes/auth.routes';
import { ventasRoutesFactory } from './routes/ventas.routes';
import productosRoutes from './routes/productos.routes';
import reportesRoutes from './routes/reportes.routes';
import negociosRoutes from './routes/negocios.routes';
import usuariosRoutes from './routes/usuarios.routes';
import clientesRoutes from './routes/clientes.routes';
import tiendaRoutes from './routes/tienda.routes';
import path from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/negocios', negociosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/tienda', tiendaRoutes);
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// CONFIGURACIÓN DEL SERVIDOR WEBSOCKET
// ==========================================
export const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST']
    }
});

// Middleware Global de Autenticación para Sockets
io.use((socket, next) => {
    // Extraemos el token que envía el frontend
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Autenticación denegada: Token no provisto'));
    }

    try {
        // Validamos el JWT
        const payload = jwt.verify(token, process.env.JWT_SECRET as string);
        socket.data.socio = payload; // Guardamos los datos en la memoria del socket
        next();
    } catch (err) {
        return next(new Error('Autenticación denegada: Token inválido o expirado'));
    }
});

// Gestión de conexiones aceptadas
// Gestión de conexiones aceptadas
io.on('connection', (socket) => {
    const socio = socket.data.socio;

    // 🛡️ Salvavidas: Buscar el nombre en diferentes posibles propiedades o usar un fallback
    const nombreUsuario = socio.nombre || socio.name || socio.usuario?.nombre || socio.email || 'Usuario OAuth';

    console.log(`🟢 Socket conectado: ${socket.id} | Usuario: ${nombreUsuario}`);

    // Unimos automáticamente al usuario a la sala de su empresa
    if (socio.negocioId) {
        socket.join(socio.negocioId);
        console.log(`🏢 Usuario ${nombreUsuario} asignado a la sala del negocio: ${socio.negocioId}`);
    }

    socket.on('disconnect', () => {
        console.log(`🔴 Cliente desconectado: ${socket.id} | Usuario: ${nombreUsuario}`);
    });
});

// Pasamos el IO a las rutas de ventas como ya lo tenías
app.use('/api/ventas', ventasRoutesFactory(io));

app.get('/api/health', (req, res) => {
    res.status(200).json({ estado: 'ok', mensaje: 'Servidor corriendo' });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`WebSocket listo y blindado en ws://localhost:${PORT}`);
});