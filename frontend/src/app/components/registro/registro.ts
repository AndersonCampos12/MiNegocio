import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink], // Agregamos RouterLink para el botón de "Inicia sesión"
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  adminNombre = '';
  email = '';
  password = '';
  telefono = '';
  negocioNombre = '';
  aceptaTerminos = false;

  errorMsg = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  ejecutarRegistro() {
    this.errorMsg = '';

    // Validaciones estrictas
    if (!this.adminNombre || !this.email || !this.password || !this.negocioNombre) {
      this.mostrarError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (this.password.length < 6) {
      this.mostrarError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!this.aceptaTerminos) {
      this.mostrarError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    this.cargando = true;

    const datosPayload = {
      adminNombre: this.adminNombre,
      email: this.email,
      password: this.password,
      telefono: this.telefono,
      negocioNombre: this.negocioNombre
    };

    // Envío al backend
    // Envío al backend
    this.authService.registrar(datosPayload).subscribe({
      next: (respuesta) => {
        this.ngZone.run(() => {
          this.cargando = false;
          // Mostramos una alerta amigable (luego puedes cambiarla por un Toast bonito)
          alert('¡Solicitud enviada! Tu cuenta será revisada por un administrador. Te notificaremos cuando esté activa.');
          this.router.navigate(['/login']);
        });
      },
      error: (moduloError) => {
        this.ngZone.run(() => {
          this.mostrarError(moduloError.error?.mensaje || 'Error al conectar con el servidor. El correo o empresa ya existen.');
        });
      }
    });
  }

  // Método auxiliar para manejar la UI de manera limpia
  private mostrarError(mensaje: string) {
    this.cargando = false;
    this.errorMsg = mensaje;
    this.cdr.detectChanges(); // Forzamos actualización visual
  }
}