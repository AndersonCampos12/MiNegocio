import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario';
import { AdminLayout } from '../admin-layout/admin-layout';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router'; // <-- AGREGAR ESTO
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

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

  usuarioActual: any = null;
  rolActual: string | null = null;

  // Estado del formulario
  formulario: any = {
    id: '',
    nombre: '',
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
      error: (err) => console.error('Error al cargar empresas', err)
    });
  }

  get esSuperadmin(): boolean {
    return this.usuarioLogueado?.rol === 'SUPERADMIN';
  }

  cargarUsuarios() {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cdr.detectChanges(); // ✅
      },
      error: (err) => console.error('Error cargando usuarios:', err)
    });
  }

  abrirModal(usuario?: any) {
    this.mostrarModal = true;
    if (usuario) {
      this.esEdicion = true;
      // Clonamos el objeto y limpiamos la contraseña para que no se muestre
      this.formulario = { ...usuario, password: '' };
    } else {
      this.esEdicion = false;
      this.formulario = { id: '', nombre: '', email: '', password: '', rol: 'VENDEDOR', negocioId: '' };
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardar() {
    if (this.esEdicion) {
      this.usuarioService.actualizarUsuario(this.formulario.id, this.formulario).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModal();
        },
        error: (err) => this.toast.error(err.error?.mensaje || 'Error al actualizar')
      });
    } else {
      this.usuarioService.crearUsuario(this.formulario).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModal();
        },
        error: (err) => this.toast.error(err.error?.mensaje || 'Error al crear')
      });
    }
  }

  eliminar(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario definitivamente?')) {
      this.usuarioService.eliminarUsuario(id).subscribe({
        next: () => this.cargarUsuarios(),
        error: (err) => console.error('Error al eliminar', err)
      });
    }
  }
}