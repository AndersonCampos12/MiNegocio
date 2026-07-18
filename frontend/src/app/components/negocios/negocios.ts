import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminLayout } from '../admin-layout/admin-layout'; // Verifica esta ruta
import { NegociosService } from '../../services/negocios';
import { AuthService } from '../../services/auth'; // Asegúrate de la ruta correcta a tu auth.ts
import { ToastService } from '../../services/toast';
import { obtenerMensajeHttp } from '../../utils/http-error';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-negocios',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayout, RouterModule],
  templateUrl: './negocios.html',
  styleUrl: './negocios.css'
})
export class Negocios implements OnInit, OnDestroy {
  private sub: any;
  esSuperadmin = false;

  empresas: any[] = [];
  mostrarModal = false;
  esEdicion = false;
  cargando = false;
  guardando = false;
  filtroTexto = '';
  filtroEstado = '';

  usuarioActual: any = null;
  rolActual: string | null = null;

  formulario: any = {
    nombre: '',
    slug: '',
    plan: 'MULTI',
    estado: 'ACTIVO',
    adminNombre: '',
    adminCedula: '',
    adminEmail: '',
    adminPassword: ''
  };

  constructor(
    private toast: ToastService,
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
    this.cargando = true;
    this.negociosService.obtenerTodos().subscribe({
      next: (data) => {
        this.empresas = data;
        this.cargando = false;
        this.cdr.detectChanges(); // ← faltaba esto
      },
      error: (err) => {
        this.cargando = false;
        this.toast.error(obtenerMensajeHttp(err, 'No fue posible cargar las empresas.'));
        this.cdr.detectChanges();
      }
    });
  }

  get empresasFiltradas(): any[] {
    const texto = this.filtroTexto.trim().toLowerCase();
    return this.empresas.filter(empresa => {
      const coincideTexto = !texto || [empresa.nombre, empresa.slug, empresa.plan]
        .some(valor => String(valor ?? '').toLowerCase().includes(texto));
      return coincideTexto && (!this.filtroEstado || empresa.estado === this.filtroEstado);
    });
  }

  get totalActivas(): number {
    return this.empresas.filter(empresa => empresa.estado === 'ACTIVO').length;
  }

  get totalPendientes(): number {
    return this.empresas.filter(empresa => empresa.estado === 'PENDIENTE').length;
  }

  abrirModal(empresa?: any) {
    this.mostrarModal = true;
    if (empresa) {
      this.esEdicion = true;
      this.formulario = { ...empresa, adminNombre: '', adminCedula: '', adminEmail: '', adminPassword: '' };
    } else {
      this.esEdicion = false;
      this.formulario = { nombre: '', slug: '', plan: 'MULTI', estado: 'ACTIVO', adminNombre: '', adminCedula: '', adminEmail: '', adminPassword: '' };
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
      error: (err) => this.toast.error(obtenerMensajeHttp(err, 'No fue posible cargar los datos de tu empresa.'))
    });
  }

  actualizarSlug() {
    if (this.esEdicion) return;
    this.formulario.slug = String(this.formulario.nombre ?? '')
      .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  guardar() {
    if (this.guardando) return;
    const nombre = String(this.formulario.nombre ?? '').trim();
    const slug = String(this.formulario.slug ?? '').trim().toLowerCase();

    if (nombre.length < 2 || nombre.length > 100) return this.toast.warning('El nombre de la empresa debe tener entre 2 y 100 caracteres.');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return this.toast.warning('El slug solo puede contener minúsculas, números y guiones.');

    if (!this.esEdicion && this.esSuperadmin) {
      const adminNombre = String(this.formulario.adminNombre ?? '').trim();
      const adminCedula = String(this.formulario.adminCedula ?? '').trim();
      const adminEmail = String(this.formulario.adminEmail ?? '').trim().toLowerCase();
      const adminPassword = String(this.formulario.adminPassword ?? '');
      if (adminNombre.length < 2) return this.toast.warning('Ingresa el nombre del administrador.');
      if (!/^\d{10}$/.test(adminCedula)) return this.toast.warning('La cédula del administrador debe tener 10 dígitos.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) return this.toast.warning('Ingresa un correo electrónico válido para el administrador.');
      if (adminPassword.length < 8) return this.toast.warning('La contraseña debe tener al menos 8 caracteres.');
      this.formulario = { ...this.formulario, adminNombre, adminCedula, adminEmail, nombre, slug };
    } else {
      this.formulario = { ...this.formulario, nombre, slug };
    }

    this.guardando = true;
    if (this.esEdicion || !this.esSuperadmin) {
      // Editar
      this.negociosService.actualizarEmpresa(this.formulario.id, this.formulario).pipe(finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      })).subscribe({
        next: () => {
          this.toast.success('Datos de la empresa actualizados.');
          if (this.esSuperadmin) {
            this.cargarTodasLasEmpresas();
            this.cerrarModal();
          }
        },
        error: (err) => this.toast.error(obtenerMensajeHttp(err, 'No fue posible actualizar la empresa.'))
      });
    } else {
      // Crear nueva (Mapeo exacto a tu servicio backend)
      const payload = {
        nombreNegocio: this.formulario.nombre,
        slug: this.formulario.slug,
        plan: this.formulario.plan,
        estado: this.formulario.estado,
        nombreAdmin: this.formulario.adminNombre,
        cedulaAdmin: this.formulario.adminCedula,
        emailAdmin: this.formulario.adminEmail,
        passwordAdmin: this.formulario.adminPassword
      };

      this.negociosService.crearEmpresaYAdmin(payload).pipe(finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      })).subscribe({
        next: () => {
          this.toast.success('Empresa creada exitosamente.');
          this.cargarTodasLasEmpresas();
          this.cerrarModal();
        },
        error: (err) => this.toast.error(obtenerMensajeHttp(err, 'No fue posible crear la empresa.'))
      });
    }
  }
}
