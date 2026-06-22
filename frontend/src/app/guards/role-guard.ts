import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
// Asegúrate de que AuthService tenga un método que extraiga el rol del JWT o del estado global
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const rolesPermitidos = route.data['roles'] as Array<string>;
  const rolUsuario = authService.getRole(); // Implementa esto en tu AuthService

  if (!rolUsuario) {
    router.navigate(['/admin/login']);
    return false;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(rolUsuario)) {
    // Redirigir a una página genérica si no tiene permiso, o al dashboard base
    router.navigate(['/']);
    return false;
  }

  return true;
};