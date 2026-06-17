import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard'; // <-- Importa el nuevo guard

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

export const routes: Routes = [
    // PANTALLAS PÚBLICAS (Protegidas con guestGuard)
    { path: '', component: Splash, canActivate: [guestGuard] },
    { path: 'welcome', component: Welcome, canActivate: [guestGuard] },
    { path: 'login', component: Login, canActivate: [guestGuard] },
    { path: 'registro', component: Registro, canActivate: [guestGuard] },
    { path: 'verificacion', component: Verificacion, canActivate: [guestGuard] },

    // PANTALLAS PRIVADAS (Protegidas con authGuard)
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: 'caja', component: Caja, canActivate: [authGuard] },
    { path: 'inventario', component: Inventario, canActivate: [authGuard] },
    { path: 'crear-producto', component: CrearProducto, canActivate: [authGuard] },
    { path: 'reportes', component: Reportes, canActivate: [authGuard] },

    { path: '**', redirectTo: '' }
];