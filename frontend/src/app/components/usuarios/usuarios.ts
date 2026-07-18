import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario';
import { AdminLayout } from '../admin-layout/admin-layout';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router'; // <-- AGREGAR ESTO
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { obtenerMensajeHttp } from '../../utils/http-error';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayout, RouterModule],
  templateUrl: './usuarios.html'
})
export class Usuarios implements OnInit, OnDestroy {
  private sub: any;
  usuarios: any[] = [];
  mostrarModal = false;
  esEdicion = false;
  usuarioLogueado: any = null;
  empresas: any[] = [];
  cargando = false;
  guardando = false;
  filtroTexto = '';
  filtroRol = '';
  filtroEmpresa = '';

  usuarioActual: any = null;
  rolActual: string | null = null;

  // Estado del formulario
  formulario: any = {
    id: '',
    nombre: '',
    cedula: '',
    email: '',
    password: '',
    rol: 'VENDEDOR',
    negocioId: '' // Solo lo usará el SUPERADMIN
  };

  rolesDisponibles = ['ADMINISTRADOR', 'VENDEDOR', 'CAJERO', 'CLIENTE'];

  constructor(
    private toast: ToastService,
    private usuarioService: UsuarioService,
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarUsuarios();
    if (this.esSuperadmin) {  // esSuperadmin ahora lee de usuarioLogueado que ya fue asignado
      this.cargarEmpresas();
    }
  }

  cargarDatosUsuario() {
    this.rolActual = this.authService.getRole();
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      this.usuarioActual = JSON.parse(usuarioStr);
      this.usuarioLogueado = this.usuarioActual; // asignado ANTES de que esSuperadmin se evalúe
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
    window.location.href = '/admin/login';
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  cargarEmpresas() {
    this.http.get<any[]>('http://localhost:3000/api/negocios').subscribe({
      next: (data) => {
        this.empresas = data;
        this.cdr.detectChanges(); // ✅
      },
      error: (err) => this.toast.error(obtenerMensajeHttp(err, 'No fue posible cargar las empresas.'))
    });
  }

  get esSuperadmin(): boolean {
    return this.usuarioLogueado?.rol === 'SUPERADMIN';
  }

  cargarUsuarios() {
    this.cargando = true;
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
        this.cdr.detectChanges(); // ✅
      },
      error: (err) => {
        this.cargando = false;
        this.toast.error(obtenerMensajeHttp(err, 'No fue posible cargar los usuarios.'));
        this.cdr.detectChanges();
      }
    });
  }

  get usuariosFiltrados(): any[] {
    const texto = this.filtroTexto.trim().toLowerCase();
    return this.usuarios.filter(usuario => {
      const coincideTexto = !texto || [usuario.nombre, usuario.cedula, usuario.email]
        .some(valor => String(valor ?? '').toLowerCase().includes(texto));
      const coincideRol = !this.filtroRol || usuario.rol === this.filtroRol;
      const coincideEmpresa = !this.filtroEmpresa || usuario.negocioId === this.filtroEmpresa;
      return coincideTexto && coincideRol && coincideEmpresa;
    });
  }

  abrirModal(usuario?: any) {
    this.mostrarModal = true;
    if (usuario) {
      this.esEdicion = true;
      // Clonamos el objeto y limpiamos la contraseña para que no se muestre
      this.formulario = { ...usuario, cedula: usuario.cedula || '', password: '' };
    } else {
      this.esEdicion = false;
      this.formulario = { id: '', nombre: '', cedula: '', email: '', password: '', rol: 'VENDEDOR', negocioId: '' };
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardar() {
    if (this.guardando) return;

    const nombre = String(this.formulario.nombre ?? '').trim();
    const cedula = String(this.formulario.cedula ?? '').trim();
    const email = String(this.formulario.email ?? '').trim().toLowerCase();
    const password = String(this.formulario.password ?? '');

    if (nombre.length < 2 || nombre.length > 100) return this.toast.warning('El nombre debe tener entre 2 y 100 caracteres.');
    if (!/^\d{10}$/.test(cedula)) return this.toast.warning('La cédula es obligatoria y debe contener 10 dígitos.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.toast.warning('Ingresa un correo electrónico válido.');
    if (!this.esEdicion && password.length < 8) return this.toast.warning('La contraseña debe tener al menos 8 caracteres.');
    if (this.esEdicion && password && password.length < 8) return this.toast.warning('La nueva contraseña debe tener al menos 8 caracteres.');
    if (!this.rolesDisponibles.includes(this.formulario.rol)) return this.toast.warning('Selecciona un rol válido.');
    if (this.esSuperadmin && !this.formulario.negocioId) return this.toast.warning('Selecciona la empresa a la que pertenece el usuario.');

    this.formulario = { ...this.formulario, nombre, cedula, email };
    this.guardando = true;

    if (this.esEdicion) {
      this.usuarioService.actualizarUsuario(this.formulario.id, this.formulario).pipe(finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      })).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModal();
          this.toast.success('Usuario actualizado correctamente.');
        },
        error: (err) => {
          this.guardando = false;
          this.cdr.detectChanges();
          this.toast.error(obtenerMensajeHttp(err, 'No fue posible actualizar el usuario.'));
        }
      });
    } else {
      this.usuarioService.crearUsuario(this.formulario).pipe(finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      })).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModal();
          this.toast.success('Usuario creado correctamente.');
        },
        error: (err) => {
          this.guardando = false;
          this.cdr.detectChanges();
          this.toast.error(obtenerMensajeHttp(err, 'No fue posible crear el usuario.'));
        }
      });
    }
  }

  eliminar(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario definitivamente?')) {
      this.usuarioService.eliminarUsuario(id).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.toast.success('Usuario eliminado correctamente.');
        },
        error: (err) => this.toast.error(obtenerMensajeHttp(err, 'No fue posible eliminar el usuario.'))
      });
    }
  }
}
