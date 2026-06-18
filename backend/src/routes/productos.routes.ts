import { Router } from 'express';
import { upload } from '../config/multer';
import { ProductosService } from '../services/productos.service'; // Ajusta la ruta a donde guardaste tu servicio
import { prisma } from '../config/database'; // O '../index' según tu estructura

const router = Router();
const productosService = new ProductosService();

// Endpoint: POST /api/productos
router.post('/', upload.single('imagen'), async (req, res) => {
    try {
        // 1. Extraemos los datos de texto (FormData manda todo como string, hay que parsearlo)
        const { nombre, valor, stock, descripcion, socioId } = req.body;

        // 2. Extraemos la ruta del archivo físico si Multer lo procesó
        const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // 3. Armamos el objeto para tu servicio
        const dataProducto = {
            nombre,
            valor: parseFloat(valor),
            stock: parseInt(stock, 10),
            descripcion,
            imagenUrl
        };

        // 4. Llamamos a tu capa de servicios
        const nuevoProducto = await productosService.crearProducto(socioId, dataProducto);

        res.status(201).json(nuevoProducto);
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ mensaje: 'Error interno al guardar el producto' });
    }
});

// Endpoint: GET /api/productos
router.get('/', async (req, res) => {
    try {
        // 1. Recibimos el ID del socio que mandó Angular
        const socioId = req.query.socioId as string;

        if (!socioId) {
            return res.status(400).json({ mensaje: 'Falta el ID del administrador' });
        }

        // 2. Le preguntamos a la base de datos a qué negocio pertenece este socio
        const socio = await prisma.socio.findUnique({
            where: { id: socioId },
            select: { negocioId: true } // Solo traemos el dato que nos importa
        });

        if (!socio) {
            return res.status(404).json({ mensaje: 'Socio no encontrado' });
        }

        // 3. Ahora sí, le pasamos el negocioId real a tu capa de servicios
        const inventario = await productosService.obtenerInventario(socio.negocioId);

        res.status(200).json(inventario);
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar los productos' });
    }
});

// Endpoint: PUT /api/productos/:id (Actualizar datos o stock)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, valor, stock, descripcion } = req.body;

        const productoActualizado = await prisma.producto.update({
            where: { id },
            data: {
                nombre,
                valor: parseFloat(valor),
                stock: parseInt(stock, 10),
                descripcion
            }
        });
        res.status(200).json(productoActualizado);
    } catch (error) {
        console.error('Error al actualizar:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el producto' });
    }
});

// Endpoint: DELETE /api/productos/:id (Borrado Lógico)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Solo cambiamos el estado a falso, no lo borramos de la base de datos
        const productoEliminado = await prisma.producto.update({
            where: { id },
            data: { activo: false }
        });
        res.status(200).json({ mensaje: 'Producto descontinuado', productoEliminado });
    } catch (error) {
        console.error('Error al eliminar:', error);
        res.status(500).json({ mensaje: 'Error al eliminar el producto' });
    }
});

export default router;