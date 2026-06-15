import { Routes } from '@angular/router';

// Importamos las clases con su nombre exacto
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
    { path: '', component: Splash },
    { path: 'welcome', component: Welcome },
    { path: 'login', component: Login },
    { path: 'registro', component: Registro },
    { path: 'verificacion', component: Verificacion },
    { path: 'dashboard', component: Dashboard },
    { path: 'caja', component: Caja },
    { path: 'inventario', component: Inventario },
    { path: 'crear-producto', component: CrearProducto },
    { path: 'reportes', component: Reportes },
    { path: '**', redirectTo: '' }
];