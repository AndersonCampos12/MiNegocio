import { Router } from 'express';
import { AuthService } from '../services/auth.service';

const router = Router();
const authService = new AuthService();

router.post('/registro', async (req, res) => {
    try {
        const resultado = await authService.registrarNegocio(req.body);
        res.status(201).json({ mensaje: 'Negocio creado', negocio: resultado.negocio });
    } catch (error: any) {
        res.status(400).json({ mensaje: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const resultado = await authService.login(email, password);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(401).json({ mensaje: error.message });
    }
});

router.post('/google', async (req, res) => {
    try {
        const { token } = req.body; // Este es el token que nos mandará Angular
        const resultado = await authService.loginGoogle(token);
        res.status(200).json(resultado);
    } catch (error: any) {
        res.status(401).json({ mensaje: error.message });
    }
});

export default router;