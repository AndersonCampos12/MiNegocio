import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';
import { roleGuard } from './guards/role-guard';

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
import { Negocios } from './components/negocios/negocios';
import { Tienda } from './components/tienda/tienda';

export const routes: Routes = [
    // =========================
    // RUTAS PARA INVITADOS (Sin sesión)
    // =========================
    { path: '', component: Splash, canActivate: [guestGuard] },
    { path: 'welcome', component: Welcome, canActivate: [guestGuard] },
    { path: 'admin/login', component: Login, canActivate: [guestGuard] },
    { path: 'admin/registro', component: Registro, canActivate: [guestGuard] },

    // =========================
    // E-COMMERCE / TIENDA
    // =========================
    // ERROR CORREGIDO: Se quita el guestGuard. 
    // Puedes dejarla pública (sin guards) o ponerle [authGuard] si solo clientes registrados pueden comprar.
    { path: 'tienda', component: Tienda, canActivate: [authGuard] },

    // =========================
    // PORTAL ADMINISTRATIVO PROTEGIDO (Nadie con rol CLIENTE entra aquí)
    // =========================
    {
        path: 'admin',
        canActivate: [authGuard, roleGuard],
        // Definimos quiénes pueden entrar a este bloque
        data: { roles: ['SUPERADMIN', 'ADMINISTRADOR', 'VENDEDOR', 'CAJERO'] },
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'caja', component: Caja },
            { path: 'inventario', component: Inventario },
            { path: 'crear-producto', component: CrearProducto },
            { path: 'reportes', component: Reportes },
            { path: 'negocios', component: Negocios },
            {
                path: 'usuarios',
                loadComponent: () => import('./components/usuarios/usuarios').then(m => m.Usuarios),
                // roleGuard extra para sobre-proteger esta ruta hija
                data: { roles: ['SUPERADMIN', 'ADMINISTRADOR'] }
            }
        ]
    },

    // Otras rutas protegidas que no son exclusivas de admin
    { path: 'verificacion', component: Verificacion, canActivate: [authGuard] },

    { path: '**', redirectTo: '' }
];