import { Router } from 'express';
import { AuthService } from '../services/auth.service';

const router = Router();
const authService = new AuthService();

router.post('/registro', async (req, res) => {
    try {
        const resultado = await authService.registrarNegocio(req.body);
        // Excluimos la contraseña de la respuesta por seguridad
        const { password, ...socioSinPassword } = resultado.socio;
        res.status(201).json({ mensaje: 'Negocio y administrador creados', negocio: resultado.negocio, socio: socioSinPassword });
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
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ mensaje: 'Token de Google requerido' });
        }
        const resultado = await authService.loginGoogle(token);
        res.status(200).json(resultado);
    } catch (error: any) {
        console.error('🚨 ERROR EN OAUTH:', error.message);
        res.status(401).json({ mensaje: error.message });
    }
});

export default router;