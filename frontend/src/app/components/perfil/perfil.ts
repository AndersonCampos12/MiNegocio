import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminLayout],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  usuarioActual: any = null;
  perfil = { nombre: '', cedula: '', email: '', rol: '', negocio: null as any };
  claves = { actual: '', nueva: '', confirmar: '' };
  cargando = true;
  guardandoPerfil = false;
  guardandoPassword = false;
  mostrarActual = false;
  mostrarNueva = false;

  constructor(
    private authService: AuthService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.usuarioActual = this.authService.getSocioActual();
    this.authService.obtenerPerfil().pipe(finalize(() => {
      this.cargando = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (perfil: any) => {
        this.perfil = {
          nombre: perfil.nombre || '',
          cedula: perfil.cedula || '',
          email: perfil.email || '',
          rol: perfil.rol || '',
          negocio: perfil.negocio || null
        };
        this.authService.actualizarUsuarioLocal(perfil);
        this.usuarioActual = this.authService.getSocioActual();
      },
      error: (err) => this.toast.error(err.error?.mensaje || 'No fue posible cargar tu perfil.')
    });
  }

  get esCliente() {
    return this.perfil.rol === 'CLIENTE' || this.usuarioActual?.rol === 'CLIENTE';
  }

  guardarPerfil() {
    const nombre = this.perfil.nombre.trim();
    const cedula = this.perfil.cedula.trim();
    const email = this.perfil.email.trim().toLowerCase();

    if (nombre.length < 2 || nombre.length > 100) return this.toast.warning('El nombre debe tener entre 2 y 100 caracteres.');
    if (!/^\d{10}(\d{3})?$/.test(cedula)) return this.toast.warning('Ingresa una cédula de 10 dígitos o un RUC de 13 dígitos.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return this.toast.warning('Ingresa un correo electrónico válido.');

    this.guardandoPerfil = true;
    this.authService.actualizarPerfil({ nombre, cedula, email }).pipe(finalize(() => {
      this.guardandoPerfil = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (respuesta: any) => {
        this.perfil = { ...this.perfil, ...respuesta.perfil };
        this.usuarioActual = this.authService.getSocioActual();
        this.toast.success(respuesta.mensaje || 'Perfil actualizado correctamente.');
      },
      error: (err) => this.toast.error(err.error?.mensaje || 'No fue posible actualizar tu perfil.')
    });
  }

  cambiarPassword() {
    if (!this.claves.actual) return this.toast.warning('Ingresa tu contraseña actual.');
    if (this.claves.nueva.length < 8) return this.toast.warning('La nueva contraseña debe tener al menos 8 caracteres.');
    if (this.claves.actual === this.claves.nueva) return this.toast.warning('La nueva contraseña debe ser diferente a la actual.');
    if (this.claves.nueva !== this.claves.confirmar) return this.toast.warning('Las contraseñas nuevas no coinciden.');

    this.guardandoPassword = true;
    this.authService.cambiarPassword(this.claves.actual, this.claves.nueva).pipe(finalize(() => {
      this.guardandoPassword = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (respuesta: any) => {
        this.claves = { actual: '', nueva: '', confirmar: '' };
        this.toast.success(respuesta.mensaje || 'Contraseña actualizada correctamente.');
      },
      error: (err) => this.toast.error(err.error?.mensaje || 'No fue posible cambiar la contraseña.')
    });
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
