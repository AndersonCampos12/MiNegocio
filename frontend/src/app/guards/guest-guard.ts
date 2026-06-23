import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth'; // Asegúrate de la ruta correcta

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // 🔥 Si ya está logueado, vemos su rol para mandarlo al lugar correcto
    const rolUsuario = authService.getRole();

    if (rolUsuario === 'CLIENTE') {
      router.navigate(['/tienda']);
    } else {
      router.navigate(['/admin/dashboard']);
    }
    return false;
  }

  // Si no está logueado, lo dejamos pasar a las páginas públicas (login, splash)
  return true;
};