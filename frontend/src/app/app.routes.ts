import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';
import { roleGuard } from './guards/role-guard'; // <-- 1. SOLUCIÓN: Importamos el roleGuard

import { Splash } from './components/splash/splash';
import { Welcome } from './components/welcome/welcome';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { Verificacion } from './components/verificacion/verificacion';
import { Dashboard } from './components/dashboard/dashboard';
import { Caja } from './components/caja/caja';
import { Inventario } from './components/inventario/inventario';
import { CrearProducto } from './components/crear-producto/crear-producto';
import { Reportes } from './components/reportes/reportes';
// 2. SOLUCIÓN: Eliminamos la importación estática de 'Usuarios' de aquí arriba

export const routes: Routes = [
    // PUBLICO
    { path: '', component: Splash, canActivate: [guestGuard] },
    { path: 'welcome', component: Welcome, canActivate: [guestGuard] },

    // =========================
    // PORTAL ADMINISTRATIVO
    // =========================
    { path: 'admin/login', component: Login, canActivate: [guestGuard] },
    { path: 'admin/registro', component: Registro, canActivate: [guestGuard] },
    { path: 'verificacion', component: Verificacion, canActivate: [guestGuard] },

    // =========================
    // DASHBOARD ADMIN
    // =========================
    { path: 'admin/dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: 'admin/caja', component: Caja, canActivate: [authGuard] },
    { path: 'admin/inventario', component: Inventario, canActivate: [authGuard] },
    { path: 'admin/crear-producto', component: CrearProducto, canActivate: [authGuard] },
    { path: 'admin/reportes', component: Reportes, canActivate: [authGuard] },

    // NUEVA RUTA DE USUARIOS (Carga perezosa correcta)
    {
        path: 'admin/usuarios',
        loadComponent: () => import('./components/usuarios/usuarios').then(m => m.Usuarios),
        canActivate: [roleGuard],
        data: { roles: ['SUPERADMIN', 'ADMINISTRADOR'] }
    },

    { path: '**', redirectTo: '' }
];