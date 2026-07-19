import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.css'
})
export class RecuperarPassword {
  email = '';
  codigo = '';
  password = '';
  confirmarPassword = '';
  paso: 1 | 2 = 1;
  cargando = false;
  reenviando = false;
  completado = false;
  mensaje = '';
  errorMsg = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  solicitarCodigo() {
    const email = this.email.trim().toLowerCase();
    this.errorMsg = '';
    this.mensaje = '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMsg = 'Ingresa un correo electrónico válido.';
      return;
    }

    this.cargando = true;
    this.authService.solicitarRecuperacion(email).pipe(finalize(() => {
      this.cargando = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (respuesta: any) => {
        this.email = email;
        this.paso = 2;
        this.mensaje = respuesta.mensaje;
      },
      error: err => this.errorMsg = err.error?.mensaje || 'No fue posible procesar la solicitud.'
    });
  }

  restablecer() {
    this.errorMsg = '';
    this.mensaje = '';
    if (!/^\d{6}$/.test(this.codigo.trim())) {
      this.errorMsg = 'El código debe contener 6 dígitos.';
      return;
    }
    if (this.password.length < 8) {
      this.errorMsg = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }
    if (this.password !== this.confirmarPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }

    this.cargando = true;
    this.authService.restablecerPassword(this.email, this.codigo.trim(), this.password).pipe(finalize(() => {
      this.cargando = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (respuesta: any) => {
        this.completado = true;
        this.mensaje = respuesta.mensaje;
        this.password = '';
        this.confirmarPassword = '';
      },
      error: err => this.errorMsg = err.error?.mensaje || 'No fue posible cambiar la contraseña.'
    });
  }

  reenviar() {
    if (this.reenviando) return;
    this.errorMsg = '';
    this.reenviando = true;
    this.authService.solicitarRecuperacion(this.email).pipe(finalize(() => {
      this.reenviando = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (respuesta: any) => this.mensaje = respuesta.mensaje,
      error: err => this.errorMsg = err.error?.mensaje || 'No fue posible reenviar el código.'
    });
  }

  volverAlCorreo() {
    this.paso = 1;
    this.codigo = '';
    this.mensaje = '';
    this.errorMsg = '';
  }

  irAlLogin() {
    this.router.navigate(['/login']);
  }
}
