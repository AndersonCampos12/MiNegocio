import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware';

const router = Router();
const authService = new AuthService();

// ==========================================
// RUTAS PROTEGIDAS (Solo SuperAdmin)
// ==========================================
router.post('/admin/crear-empresa', verificarToken, verificarRol(['SUPERADMIN']), async (req, res) => {
    try {
        const resultado = await authService.crearEmpresaYAdmin(req.body);
        const { password, ...socioSinPassword } = resultado.socio;
        res.status(201).json({ mensaje: 'Empresa creada exitosamente', negocio: resultado.negocio, socio: socioSinPassword });
    } catch (error: any) {
        res.status(400).json({ mensaje: error.message });
    }
});

// ==========================================
// RUTAS PÚBLICAS (Clientes y Logins generales)
// ==========================================
router.post('/admin/registro', async (req, res) => {
    try {
        // El body DEBE incluir: nombre, email, password, y slug (de la tienda)
        const cliente = await authService.registrarCliente(req.body);
        const { password, ...clienteSinPassword } = cliente;
        res.status(201).json({ mensaje: 'Cliente registrado con éxito', cliente: clienteSinPassword });
    } catch (error: any) {
        res.status(400).json({ mensaje: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
        }
        const resultado = await authService.login(email, password);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(401).json({ mensaje: error.message });
    }
});

router.post('/google', async (req, res) => {
    try {
        // 1. Ya no pedimos el slugTienda del body
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ mensaje: 'Token de Google requerido' });
        }

        // 2. Le pasamos ÚNICAMENTE el token al servicio (1 argumento)
        const resultado = await authService.loginGoogle(token);

        res.status(200).json(resultado);
    } catch (error: any) {
        console.error('🚨 ERROR EN OAUTH:', error.message);
        res.status(401).json({ mensaje: error.message });
    }
});

export default router;