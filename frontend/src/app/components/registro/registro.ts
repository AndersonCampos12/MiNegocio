import { Component, NgZone, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro implements OnInit {
  nombre = '';
  cedula = '';
  email = '';
  password = '';
  aceptaTerminos = false;

  slugTienda = ''; // Aquí guardaremos la tienda actual
  errorMsg = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute, // Inyectamos esto para leer la URL
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // Capturamos el slug de la tienda desde la URL (ej: /tienda/importaciones-rs/registro)
    this.slugTienda = this.route.snapshot.paramMap.get('slug') || 'sistema-central';
  }

  ejecutarRegistro() {
    this.errorMsg = '';

    if (!this.nombre || !this.cedula || !this.email || !this.password) {
      this.mostrarError('Por favor, completa todos los campos.');
      return;
    }

    if (!/^\d{10}(\d{3})?$/.test(this.cedula.trim())) {
      this.mostrarError('Ingresa una cédula de 10 dígitos o un RUC de 13 dígitos.');
      return;
    }

    if (this.password.length < 8) {
      this.mostrarError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!this.aceptaTerminos) {
      this.mostrarError('Debes aceptar las políticas de privacidad.');
      return;
    }

    this.cargando = true;

    // Payload limpio, sin datos de empresas. El backend hará el resto gracias al slug.
    const datosPayload = {
      nombre: this.nombre,
      cedula: this.cedula.trim(),
      email: this.email,
      password: this.password,
      slug: this.slugTienda
    };

    // Usamos el endpoint público que creamos en auth.routes.ts
    this.authService.registrarCliente(datosPayload).subscribe({
      // ¡SOLUCIÓN!: Le decimos a TypeScript que esto es (respuesta: any)
      next: (respuesta: any) => {
        this.ngZone.run(() => {
          this.cargando = false;
          this.router.navigate(['/verificacion'], {
            queryParams: { email: this.email.trim().toLowerCase(), slug: this.slugTienda }
          });
        });
      },
      // ¡SOLUCIÓN!: Le decimos a TypeScript que esto es (err: any)
      error: (err: any) => {
        this.ngZone.run(() => {
          this.mostrarError(err.error?.mensaje || 'Error al registrarte. El correo ya existe.');
        });
      }
    });
  }

  private mostrarError(mensaje: string) {
    this.cargando = false;
    this.errorMsg = mensaje;
    this.cdr.detectChanges();
  }
}
