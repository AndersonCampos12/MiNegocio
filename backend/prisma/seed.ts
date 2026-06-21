import { PrismaClient, Rol } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Iniciando poblado de la base de datos...');

    const email = process.env.SUPERADMIN_EMAIL || 'admin@minegocio.com';
    const password = process.env.SUPERADMIN_PASSWORD || 'admin123';
    const nombre = process.env.SUPERADMIN_NOMBRE || 'Super Admin';

    // 1. Crear el Negocio "Raíz" (La plataforma en sí)
    const negocioRoot = await prisma.negocio.upsert({
        where: { slug: 'sistema-central' },
        update: {}, // Si ya existe, no hace nada
        create: {
            nombre: 'Sistema Central MiNegocio',
            slug: 'sistema-central',
            estado: 'ACTIVO',
            plan: 'ILIMITADO'
        }
    });

    // 2. Encriptar la contraseña del .env
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Crear al Super Administrador
    const superAdmin = await prisma.socio.upsert({
        where: { email: email },
        update: {}, // Usamos upsert con update vacío para NO sobreescribir la clave si el admin la cambia después en el sistema
        create: {
            nombre: nombre,
            email: email,
            password: hashedPassword,
            rol: Rol.SUPERADMIN,
            negocioId: negocioRoot.id
        }
    });

    console.log('✅ Base de datos poblada exitosamente.');
    console.log(`👑 SuperAdmin creado: ${superAdmin.email}`);
}

main()
    .catch((e) => {
        console.error('🚨 Error en el Seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });