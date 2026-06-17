import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  // Campos unificados que requiere el backend para crear el Socio y el Negocio
  adminNombre = '';
  email = '';
  password = '';
  telefono = '';
  negocioNombre = '';
  aceptaTerminos = false;

  errorMsg = '';
  cargando = false;

  constructor(private authService: AuthService, private router: Router) { }

  ejecutarRegistro() {
    this.errorMsg = '';

    // Validación humana antes de enviar datos al servidor
    if (!this.adminNombre || !this.email || !this.password || !this.negocioNombre) {
      this.errorMsg = 'Nombres, correo, contraseña y empresa son obligatorios.';
      return;
    }

    if (!this.aceptaTerminos) {
      this.errorMsg = 'Debes aceptar los términos y condiciones.';
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

    // Envío asíncrono al backend
    this.authService.registrar(datosPayload).subscribe({
      next: (respuesta) => {
        this.cargando = false;
        alert('¡Negocio y Administrador creados con éxito!');
        // Una vez guardado con éxito, avanzamos a la pantalla de verificación
        this.router.navigate(['/verificacion']);
      },
      error: (moduloError) => {
        this.cargando = false;
        this.errorMsg = moduloError.error?.mensaje || 'Error al conectar con el servidor de registro.';
      }
    });
  }
}