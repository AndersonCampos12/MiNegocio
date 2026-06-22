import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario';
import { AdminLayout } from '../admin-layout/admin-layout';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router'; // <-- AGREGAR ESTO

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayout, RouterModule],
  templateUrl: './usuarios.html'
})
export class Usuarios implements OnInit {
  usuarios: any[] = [];
  mostrarModal = false;
  esEdicion = false;
  usuarioLogueado: any = null;
  empresas: any[] = [];

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
    private usuarioService: UsuarioService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      this.usuarioLogueado = JSON.parse(userStr);
    }
    this.cargarUsuarios();

    // Si es superadmin, cargamos la lista de empresas para el select
    if (this.esSuperadmin) {
      this.cargarEmpresas();
    }
  }

  cargarEmpresas() {
    // Petición directa para no crear un servicio entero ahora mismo
    this.http.get<any[]>('http://localhost:3000/api/negocios').subscribe({
      next: (data) => this.empresas = data,
      error: (err) => console.error('Error al cargar empresas', err)
    });
  }

  get esSuperadmin(): boolean {
    return this.usuarioLogueado?.rol === 'SUPERADMIN';
  }

  cargarUsuarios() {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (data) => this.usuarios = data,
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
        error: (err) => alert(err.error?.mensaje || 'Error al actualizar')
      });
    } else {
      this.usuarioService.crearUsuario(this.formulario).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModal();
        },
        error: (err) => alert(err.error?.mensaje || 'Error al crear')
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