import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest, verificarToken, verificarRol } from '../middlewares/auth.middleware';
import { AppError, CuentaNoActivadaError } from '../errors/app.error';

const router = Router();
const authService = new AuthService();

router.get('/perfil', verificarToken, async (req, res) => {
    try {
        const perfil = await authService.obtenerPerfil((req as AuthRequest).socio.id);
        res.status(200).json(perfil);
    } catch (error: any) {
        res.status(error instanceof AppError ? error.statusCode : 400).json({ mensaje: error.message });
    }
});

router.put('/perfil', verificarToken, async (req, res) => {
    try {
        const perfil = await authService.actualizarPerfil((req as AuthRequest).socio.id, req.body);
        res.status(200).json({ mensaje: 'Perfil actualizado correctamente.', perfil });
    } catch (error: any) {
        res.status(error instanceof AppError ? error.statusCode : 400).json({ mensaje: error.message });
    }
});

router.put('/cambiar-password', verificarToken, async (req, res) => {
    try {
        await authService.cambiarPassword((req as AuthRequest).socio.id, req.body?.passwordActual, req.body?.passwordNueva);
        res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
    } catch (error: any) {
        res.status(error instanceof AppError ? error.statusCode : 400).json({ mensaje: error.message });
    }
});

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
        const resultado = await authService.registrarCliente(req.body);
        const clienteSinDatosSensibles = {
            id: resultado.cliente.id,
            nombre: resultado.cliente.nombre,
            cedula: resultado.cliente.cedula,
            email: resultado.cliente.email,
            rol: resultado.cliente.rol
        };
        res.status(201).json({
            mensaje: 'Enviamos un código de verificación a tu correo.',
            requiereVerificacion: resultado.requiereVerificacion,
            cliente: clienteSinDatosSensibles
        });
    } catch (error: any) {
        res.status(error instanceof AppError ? error.statusCode : 400).json({ mensaje: error.message });
    }
});

router.post('/verificar', async (req, res) => {
    try {
        await authService.verificarCodigo(req.body?.email, req.body?.codigo);
        res.status(200).json({ mensaje: 'Cuenta verificada correctamente. Ya puedes iniciar sesión.' });
    } catch (error: any) {
        res.status(error instanceof AppError ? error.statusCode : 400).json({ mensaje: error.message });
    }
});

router.post('/reenviar-codigo', async (req, res) => {
    try {
        await authService.reenviarCodigo(req.body?.email);
        res.status(200).json({ mensaje: 'Si la cuenta está pendiente, recibirás un nuevo código.' });
    } catch (error: any) {
        res.status(error instanceof AppError ? error.statusCode : 400).json({ mensaje: error.message });
    }
});

router.post('/solicitar-recuperacion', async (req, res) => {
    try {
        await authService.solicitarRecuperacion(req.body?.email);
        res.status(200).json({ mensaje: 'Si el correo está registrado, recibirás un código para recuperar tu contraseña.' });
    } catch (error: any) {
        res.status(error instanceof AppError ? error.statusCode : 400).json({ mensaje: error.message });
    }
});

router.post('/restablecer-password', async (req, res) => {
    try {
        await authService.restablecerPassword(req.body?.email, req.body?.codigo, req.body?.password);
        res.status(200).json({ mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
    } catch (error: any) {
        res.status(error instanceof AppError ? error.statusCode : 400).json({ mensaje: error.message });
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
        res.status(error instanceof AppError ? error.statusCode : 401).json({
            mensaje: error.message,
            requiereVerificacion: error instanceof CuentaNoActivadaError
        });
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
