import { PrismaClient, Rol, EstadoNegocio } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────────────────────

const hash = async (pwd: string) => bcrypt.hash(pwd, await bcrypt.genSalt(10));

/** Devuelve un número entero aleatorio entre min y max (inclusive) */
const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

/** Elige un elemento aleatorio de un arreglo */
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];

/** Fecha aleatoria dentro de los últimos N días */
const fechaReciente = (diasAtras: number) => {
    const d = new Date();
    d.setDate(d.getDate() - rand(0, diasAtras));
    d.setHours(rand(8, 20), rand(0, 59));
    return d;
};

// ─── Datos de muestra ────────────────────────────────────────────────────────

const NEGOCIOS = [
    {
        nombre: 'Abarrotes Don Pepe',
        slug: 'abarrotes-don-pepe',
        plan: 'BASIC',
        estado: EstadoNegocio.ACTIVO,
    },
    {
        nombre: 'Ferretería El Clavo',
        slug: 'ferreteria-el-clavo',
        plan: 'PRO',
        estado: EstadoNegocio.ACTIVO,
    },
    {
        nombre: 'Tienda Tech Quito',
        slug: 'tienda-tech-quito',
        plan: 'PRO',
        estado: EstadoNegocio.PENDIENTE,
    },
];

// Productos por negocio (nombre, valor en USD, stock)
const PRODUCTOS_POR_NEGOCIO: Record<string, { nombre: string; valor: number; stock: number; descripcion: string }[]> = {
    'abarrotes-don-pepe': [
        { nombre: 'Arroz 5 libras', valor: 3.50, stock: 120, descripcion: 'Arroz de grano largo, cosecha nacional' },
        { nombre: 'Aceite vegetal 1L', valor: 2.80, stock: 85, descripcion: 'Aceite de girasol, botella de 1 litro' },
        { nombre: 'Azúcar blanca 2kg', valor: 2.10, stock: 95, descripcion: 'Azúcar refinada en funda de 2kg' },
        { nombre: 'Sal yodada 1kg', valor: 0.75, stock: 200, descripcion: 'Sal de mesa yodada y fluorurada' },
        { nombre: 'Fideo Tornillo 400g', valor: 1.20, stock: 60, descripcion: 'Fideo de trigo, presentación 400g' },
        { nombre: 'Atún en lata 180g', valor: 1.80, stock: 3, descripcion: 'Atún en agua, rico en proteínas' },
        { nombre: 'Leche entera 1L', valor: 1.10, stock: 40, descripcion: 'Leche pasteurizada entera, funda 1L' },
        { nombre: 'Avena en hojuelas 500g', valor: 1.95, stock: 30, descripcion: 'Avena rápida de cocción' },
        { nombre: 'Jabón de baño x3', valor: 2.40, stock: 55, descripcion: 'Pack de 3 jabones antibacteriales' },
        { nombre: 'Papel higiénico x4', valor: 2.90, stock: 70, descripcion: 'Rollo doble hoja, pack de 4' },
        { nombre: 'Detergente 1kg', valor: 3.20, stock: 45, descripcion: 'Detergente en polvo para ropa' },
        { nombre: 'Café molido 200g', valor: 3.60, stock: 25, descripcion: 'Café tostado y molido, origen Ecuador' },
        { nombre: 'Galletas de vainilla 300g', valor: 1.50, stock: 80, descripcion: 'Galletas dulces, paquete familiar' },
        { nombre: 'Salsa de tomate 200g', valor: 1.30, stock: 65, descripcion: 'Kétchup clásico, frasco de 200g' },
        { nombre: 'Huevos de campo x12', valor: 2.20, stock: 5, descripcion: 'Huevos frescos de granja, cubeta x12' },
    ],
    'ferreteria-el-clavo': [
        { nombre: 'Tornillos 1" punta fina x50', valor: 1.80, stock: 300, descripcion: 'Tornillos autoperforantes punta fina' },
        { nombre: 'Clavos 2.5" x lb', valor: 1.20, stock: 150, descripcion: 'Clavos de acero galvanizado por libra' },
        { nombre: 'Cinta métrica 5m', valor: 4.50, stock: 20, descripcion: 'Cinta de acero con freno, 5 metros' },
        { nombre: 'Martillo de garra 16oz', valor: 8.90, stock: 15, descripcion: 'Martillo de carpintero con mango de fibra' },
        { nombre: 'Nivel de burbuja 40cm', valor: 6.50, stock: 12, descripcion: 'Nivel de aluminio con 3 ampolletas' },
        { nombre: 'Lija grano 80 (pliego)', valor: 0.90, stock: 200, descripcion: 'Lija de madera grano 80, tamaño estándar' },
        { nombre: 'Lija grano 120 (pliego)', valor: 0.90, stock: 180, descripcion: 'Lija de acabado grano 120' },
        { nombre: 'Pintura blanca 1 galón', valor: 14.50, stock: 8, descripcion: 'Pintura látex interior/exterior, 1 galón' },
        { nombre: 'Brocha 3 pulgadas', valor: 3.20, stock: 25, descripcion: 'Brocha de cerdas sintéticas, 3"' },
        { nombre: 'Rodillo de pintura 9"', valor: 5.80, stock: 18, descripcion: 'Rodillo felpa media, marco incluido' },
        { nombre: 'Cable #12 AWG (metro)', valor: 1.10, stock: 4, descripcion: 'Cable eléctrico thhn #12, precio por metro' },
        { nombre: 'Interruptor simple', valor: 2.40, stock: 30, descripcion: 'Interruptor de luz 15A, color blanco' },
        { nombre: 'Tubo PVC 1/2" x 3m', valor: 3.80, stock: 40, descripcion: 'Tubo PVC presión, diámetro 1/2 pulgada' },
        { nombre: 'Codo PVC 1/2" 90°', valor: 0.35, stock: 100, descripcion: 'Codo de 90 grados para tubería PVC' },
        { nombre: 'Candado mediano', valor: 7.50, stock: 3, descripcion: 'Candado de acero 40mm con 2 llaves' },
    ],
    'tienda-tech-quito': [
        { nombre: 'Cable USB-C 1m', valor: 6.50, stock: 45, descripcion: 'Cable de carga rápida USB-C a USB-A' },
        { nombre: 'Audífonos in-ear', valor: 12.90, stock: 30, descripcion: 'Audífonos con micrófono, conector 3.5mm' },
        { nombre: 'Funda celular universal 6"', valor: 4.80, stock: 60, descripcion: 'Funda silicona para celulares 6 pulgadas' },
        { nombre: 'Vidrio templado universal', valor: 3.50, stock: 50, descripcion: 'Vidrio templado 9H para pantallas de 6"' },
        { nombre: 'Cargador de pared 20W', valor: 9.90, stock: 25, descripcion: 'Cargador PD 20W compatible con iPhone y Android' },
        { nombre: 'Hub USB 4 puertos', valor: 14.50, stock: 18, descripcion: 'Hub USB 3.0 de 4 puertos con cable 30cm' },
        { nombre: 'Mousepad gamer L', valor: 11.00, stock: 15, descripcion: 'Mousepad 80x30cm, superficie textil' },
        { nombre: 'Mouse inalámbrico', valor: 18.90, stock: 12, descripcion: 'Mouse óptico 2.4GHz, receptor USB nano' },
        { nombre: 'Teclado USB compacto', valor: 22.00, stock: 8, descripcion: 'Teclado 87 teclas, compatible Windows/Mac' },
        { nombre: 'Webcam HD 720p', valor: 28.00, stock: 2, descripcion: 'Cámara web 720p con micrófono integrado' },
        { nombre: 'Memoria USB 32GB', valor: 8.50, stock: 35, descripcion: 'Memoria flash USB 3.0, 32GB' },
        { nombre: 'Adaptador HDMI a VGA', valor: 7.20, stock: 20, descripcion: 'Convertidor HDMI macho a VGA hembra' },
        { nombre: 'Parlante Bluetooth mini', valor: 24.90, stock: 10, descripcion: 'Parlante portátil 5W con batería 8h' },
        { nombre: 'Soporte para laptop', valor: 19.50, stock: 7, descripcion: 'Soporte ajustable de aluminio para laptop' },
        { nombre: 'Limpiador de pantallas', valor: 5.00, stock: 40, descripcion: 'Kit limpieza: spray + paño microfibra' },
    ],
};

// Socios por negocio (excepto el superadmin)
const SOCIOS_POR_NEGOCIO: Record<string, { nombre: string; email: string; cedula: string; rol: Rol }[]> = {
    'abarrotes-don-pepe': [
        { nombre: 'Pedro Alvarado', email: 'pedro.alvarado@donpepe.com', cedula: '1712345678', rol: Rol.ADMINISTRADOR },
        { nombre: 'María Jiménez', email: 'maria.jimenez@donpepe.com', cedula: '1723456789', rol: Rol.CAJERO },
        { nombre: 'Luis Torres', email: 'luis.torres@donpepe.com', cedula: '1734567890', rol: Rol.VENDEDOR },
        { nombre: 'Ana Gómez', email: 'ana.gomez@donpepe.com', cedula: '1745678901', rol: Rol.VENDEDOR },
        { nombre: 'Carmen Ruiz', email: 'carmen.ruiz@cliente.com', cedula: '1756789012', rol: Rol.CLIENTE },
        { nombre: 'Jorge Mendoza', email: 'jorge.mendoza@cliente.com', cedula: '1767890123', rol: Rol.CLIENTE },
        { nombre: 'Rosa Pinto', email: 'rosa.pinto@cliente.com', cedula: '1778901234', rol: Rol.CLIENTE },
    ],
    'ferreteria-el-clavo': [
        { nombre: 'Carlos Vásquez', email: 'carlos.vasquez@elclavo.com', cedula: '1789012345', rol: Rol.ADMINISTRADOR },
        { nombre: 'Sofía Morales', email: 'sofia.morales@elclavo.com', cedula: '1790123456', rol: Rol.CAJERO },
        { nombre: 'Diego Herrera', email: 'diego.herrera@elclavo.com', cedula: '1701234567', rol: Rol.VENDEDOR },
        { nombre: 'Patricia León', email: 'patricia.leon@cliente.com', cedula: '1712348901', rol: Rol.CLIENTE },
        { nombre: 'Manuel Castro', email: 'manuel.castro@cliente.com', cedula: '1723459012', rol: Rol.CLIENTE },
        { nombre: 'Valeria Ortiz', email: 'valeria.ortiz@cliente.com', cedula: '1734560123', rol: Rol.CLIENTE },
    ],
    'tienda-tech-quito': [
        { nombre: 'Andrés Pacheco', email: 'andres.pacheco@techquito.com', cedula: '1745671234', rol: Rol.ADMINISTRADOR },
        { nombre: 'Gabriela Ríos', email: 'gabriela.rios@techquito.com', cedula: '1756782345', rol: Rol.CAJERO },
        { nombre: 'Felipe Navarro', email: 'felipe.navarro@techquito.com', cedula: '1767893456', rol: Rol.VENDEDOR },
        { nombre: 'Isabella Vargas', email: 'isabella.vargas@cliente.com', cedula: '1778904567', rol: Rol.CLIENTE },
        { nombre: 'Mateo Flores', email: 'mateo.flores@cliente.com', cedula: '1789015678', rol: Rol.CLIENTE },
    ],
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱 Iniciando poblado de la base de datos...\n');

    // ── 1. Negocio raíz + SuperAdmin (idéntico al seed original) ──────────────
    console.log('👑 Creando negocio raíz y SuperAdmin...');

    const email = process.env.SUPERADMIN_EMAIL || 'admin@minegocio.com';
    const password = process.env.SUPERADMIN_PASSWORD || 'admin123';
    const nombre = process.env.SUPERADMIN_NOMBRE || 'Super Admin';

    const negocioRoot = await prisma.negocio.upsert({
        where: { slug: 'sistema-central' },
        update: {},
        create: {
            nombre: 'Sistema Central MiNegocio',
            slug: 'sistema-central',
            estado: 'ACTIVO',
            plan: 'ILIMITADO',
        },
    });

    const superAdmin = await prisma.socio.upsert({
        where: { email },
        update: {},
        create: {
            nombre,
            email,
            password: await hash(password),
            rol: Rol.SUPERADMIN,
            negocioId: negocioRoot.id,
        },
    });

    console.log(`   ✅ SuperAdmin: ${superAdmin.email}\n`);

    // ── 2. Negocios de ejemplo ────────────────────────────────────────────────
    console.log('🏪 Creando negocios de ejemplo...');

    const negociosCreados: Record<string, { id: string; slug: string }> = {};

    for (const n of NEGOCIOS) {
        const negocio = await prisma.negocio.upsert({
            where: { slug: n.slug },
            update: { estado: n.estado, plan: n.plan },
            create: n,
        });
        negociosCreados[n.slug] = { id: negocio.id, slug: n.slug };
        console.log(`   ✅ ${negocio.nombre} (${negocio.estado})`);
    }
    console.log();

    // ── 3. Socios por negocio ─────────────────────────────────────────────────
    console.log('👤 Creando socios por negocio...');

    const sociosCreados: Record<string, { id: string; rol: Rol; negocioId: string }> = {};
    const pwdDefault = await hash('Test1234!');

    for (const [slug, socios] of Object.entries(SOCIOS_POR_NEGOCIO)) {
        const negocioId = negociosCreados[slug].id;

        for (const s of socios) {
            const socio = await prisma.socio.upsert({
                where: { email: s.email },
                update: {},
                create: {
                    ...s,
                    negocioId,
                    password: pwdDefault,
                },
            });
            sociosCreados[socio.email] = { id: socio.id, rol: socio.rol, negocioId: negocioId };
        }
        console.log(`   ✅ ${socios.length} socios → ${slug}`);
    }
    console.log();

    // ── 4. Productos por negocio ──────────────────────────────────────────────
    console.log('📦 Creando productos por negocio...');

    const productosCreados: Record<string, { id: string; valor: number; stock: number; negocioId: string }[]> = {};

    for (const [slug, productos] of Object.entries(PRODUCTOS_POR_NEGOCIO)) {
        const negocioId = negociosCreados[slug].id;
        productosCreados[slug] = [];

        for (const p of productos) {
            // Usamos nombre + negocioId como identificador "lógico" para el upsert
            const existente = await prisma.producto.findFirst({
                where: { negocioId, nombre: p.nombre },
            });

            const producto = existente
                ? await prisma.producto.update({ where: { id: existente.id }, data: p })
                : await prisma.producto.create({ data: { ...p, negocioId } });

            productosCreados[slug].push({
                id: producto.id,
                valor: Number(producto.valor),
                stock: producto.stock,
                negocioId,
            });
        }
        console.log(`   ✅ ${productos.length} productos → ${slug}`);
    }
    console.log();

    // ── 5. Ventas con detalles ────────────────────────────────────────────────
    console.log('🛒 Creando ventas y detalles...');

    // Solo creamos ventas en negocios ACTIVOS
    const negociosActivos = ['abarrotes-don-pepe', 'ferreteria-el-clavo'];

    for (const slug of negociosActivos) {
        const negocioId = negociosCreados[slug].id;
        const productos = productosCreados[slug];

        // Obtener vendedores/cajeros y clientes del negocio
        const sociosNegocio = Object.entries(sociosCreados)
            .filter(([, v]) => v.negocioId === negocioId);

        const rolesVendedor: string[] = ['CAJERO', 'VENDEDOR', 'ADMINISTRADOR'];
        const vendedores = sociosNegocio
            .filter(([, v]) => rolesVendedor.includes(v.rol as string))
            .map(([, v]) => v);

        const clientes = sociosNegocio
            .filter(([, v]) => v.rol === Rol.CLIENTE)
            .map(([, v]) => v);

        if (vendedores.length === 0) continue;

        // Crear 15 ventas por negocio activo
        for (let i = 0; i < 15; i++) {
            const vendedor = pick(vendedores);
            const cliente = Math.random() > 0.3 ? pick(clientes) : null; // 70% tiene cliente asignado

            // Elegir 1–4 productos distintos para esta venta
            const cantProductos = rand(1, Math.min(4, productos.length));
            const seleccion = [...productos].sort(() => Math.random() - 0.5).slice(0, cantProductos);

            const detalles = seleccion.map((p) => ({
                productoId: p.id,
                cantidad: rand(1, 5),
                precioUnit: p.valor,
            }));

            const subtotal = detalles.reduce((acc, d) => acc + d.precioUnit * d.cantidad, 0);
            const impuestos = parseFloat((subtotal * 0.12).toFixed(2)); // IVA 12%
            const total = parseFloat((subtotal + impuestos).toFixed(2));

            const venta = await prisma.venta.create({
                data: {
                    negocioId,
                    socioId: vendedor.id,
                    clienteId: cliente?.id ?? null,
                    subtotal,
                    impuestos,
                    total,
                    creadoEn: fechaReciente(60),
                    detalles: {
                        create: detalles.map((d) => ({
                            productoId: d.productoId,
                            cantidad: d.cantidad,
                            precioUnit: d.precioUnit,
                        })),
                    },
                },
            });
        }

        console.log(`   ✅ 15 ventas creadas → ${slug}`);
    }
    console.log();

    // ── 6. Alertas de stock bajo ──────────────────────────────────────────────
    console.log('🔔 Creando alertas de stock bajo...');

    // Productos con stock ≤ 5 en negocios activos
    for (const slug of negociosActivos) {
        const negocioId = negociosCreados[slug].id;

        const productosBajoStock = await prisma.producto.findMany({
            where: { negocioId, stock: { lte: 5 }, activo: true },
        });

        for (const p of productosBajoStock) {
            // Evitar duplicar alertas si el seed se corre varias veces
            const existe = await prisma.alerta.findFirst({
                where: { productoId: p.id },
            });

            if (!existe) {
                await prisma.alerta.create({
                    data: {
                        productoId: p.id,
                        mensaje: `⚠️ Stock bajo: "${p.nombre}" tiene solo ${p.stock} unidad(es) disponible(s).`,
                        creadoEn: new Date(),
                    },
                });
            }
        }

        console.log(`   ✅ ${productosBajoStock.length} alertas → ${slug}`);
    }
    console.log();

    // ── Resumen ───────────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════');
    console.log('✅  Base de datos poblada exitosamente');
    console.log('───────────────────────────────────────────');
    console.log(`👑  SuperAdmin : ${superAdmin.email}`);
    console.log(`🏪  Negocios   : ${NEGOCIOS.length + 1} (incluye Sistema Central)`);
    const totalSocios = Object.values(SOCIOS_POR_NEGOCIO).flat().length;
    console.log(`👤  Socios     : ${totalSocios}`);
    const totalProductos = Object.values(PRODUCTOS_POR_NEGOCIO).flat().length;
    console.log(`📦  Productos  : ${totalProductos}`);
    console.log(`🛒  Ventas     : 30 (15 por negocio activo)`);
    console.log('───────────────────────────────────────────');
    console.log('🔑  Contraseña de todos los socios de prueba: Test1234!');
    console.log('═══════════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('🚨 Error en el Seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });