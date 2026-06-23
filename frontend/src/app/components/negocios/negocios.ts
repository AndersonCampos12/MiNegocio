import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminLayout } from '../admin-layout/admin-layout'; // Verifica esta ruta
import { NegociosService } from '../../services/negocios';
import { AuthService } from '../../services/auth'; // Asegúrate de la ruta correcta a tu auth.ts

@Component({
  selector: 'app-negocios',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayout, RouterModule],
  templateUrl: './negocios.html'
})
export class Negocios implements OnInit, OnDestroy {
  private sub: any;
  esSuperadmin = false;

  empresas: any[] = [];
  mostrarModal = false;
  esEdicion = false;

  usuarioActual: any = null;
  rolActual: string | null = null;

  formulario: any = {
    nombre: '',
    slug: '',
    plan: 'MULTI',
    estado: 'ACTIVO',
    adminNombre: '',
    adminEmail: '',
    adminPassword: ''
  };

  constructor(
    private negociosService: NegociosService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();
    const rol = this.rolActual?.toUpperCase();
    this.esSuperadmin = rol === 'SUPERADMIN';
    if (this.esSuperadmin) {
      this.cargarTodasLasEmpresas();
    } else if (rol === 'ADMINISTRADOR') {
      this.cargarMiEmpresa();
    }
  }

  cargarDatosUsuario() {
    this.rolActual = this.authService.getRole();
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      this.usuarioActual = JSON.parse(usuarioStr);
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
    window.location.href = '/admin/login';
  }


  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  cargarTodasLasEmpresas() {
    this.negociosService.obtenerTodos().subscribe({
      next: (data) => {
        this.empresas = data;
        this.cdr.detectChanges(); // ← faltaba esto
      },
      error: (err) => console.error('Error cargando empresas:', err)
    });
  }

  abrirModal(empresa?: any) {
    this.mostrarModal = true;
    if (empresa) {
      this.esEdicion = true;
      this.formulario = { ...empresa };
    } else {
      this.esEdicion = false;
      this.formulario = { nombre: '', slug: '', plan: 'MULTI', estado: 'ACTIVO', adminNombre: '', adminEmail: '', adminPassword: '' };
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  cargarMiEmpresa() {
    this.negociosService.obtenerMiEmpresa().subscribe({
      next: (data) => {
        this.formulario = { ...data };
        this.cdr.detectChanges(); // ← faltaba esto
      },
      error: (err) => console.error('Error cargando mi empresa:', err)
    });
  }

  guardar() {
    if (this.esEdicion || !this.esSuperadmin) {
      // Editar
      this.negociosService.actualizarEmpresa(this.formulario.id, this.formulario).subscribe({
        next: () => {
          alert('Datos de la empresa actualizados.');
          if (this.esSuperadmin) {
            this.cargarTodasLasEmpresas();
            this.cerrarModal();
          }
        },
        error: (err) => alert(err.error?.mensaje || 'Error al actualizar')
      });
    } else {
      // Crear nueva (Mapeo exacto a tu servicio backend)
      const payload = {
        nombreNegocio: this.formulario.nombre,
        slug: this.formulario.slug,
        nombreAdmin: this.formulario.adminNombre,
        emailAdmin: this.formulario.adminEmail,
        passwordAdmin: this.formulario.adminPassword
      };

      this.negociosService.crearEmpresaYAdmin(payload).subscribe({
        next: () => {
          alert('Empresa creada exitosamente.');
          this.cargarTodasLasEmpresas();
          this.cerrarModal();
        },
        error: (err) => alert(err.error?.mensaje || 'Error al crear la empresa')
      });
    }
  }
}