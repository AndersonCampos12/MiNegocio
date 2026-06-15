import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import authRoutes from './routes/auth.routes';
import { ventasRoutesFactory } from './routes/ventas.routes';
import productosRoutes from './routes/productos.routes';

dotenv.config();

// 1. Crear el pool de conexiones con pg
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Instanciar el adaptador para Prisma
const adapter = new PrismaPg(pool);

// 3. Pasar el adaptador al cliente (¡Adiós error de opciones vacías!)
export const prisma = new PrismaClient({ adapter });

const app = express();
const httpServer = createServer(app);

// Configuración de middlewares básicos
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);

// Configuración del servidor WebSocket
export const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL }
});

io.on('connection', (socket) => {
    console.log(`Nuevo cliente conectado: ${socket.id}`);

    socket.on('unirse:negocio', (negocioId: string) => {
        socket.join(negocioId);
        console.log(`Socket ${socket.id} se unió al negocio ${negocioId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});

app.use('/api/ventas', ventasRoutesFactory(io));

// Ruta de prueba (Health Check)
app.get('/api/health', (req, res) => {
    res.status(200).json({ estado: 'ok', mensaje: 'Servidor corriendo' });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`WebSocket listo en ws://localhost:${PORT}`);
});