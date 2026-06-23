import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, AdminLayout],
  templateUrl: './crear-producto.html',
  styleUrl: './crear-producto.css'
})
export class CrearProducto {
  nombre = '';
  valor: number | null = null;
  stock: number | null = null;
  descripcion = '';
  archivoSeleccionado: File | null = null;
  vistaPrevia: string | null = null;
  guardando = false;
  usuarioActual: any = null;
  rolActual: string | null = null;

  constructor(
    private toast: ToastService,
    private productoService: ProductoService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();
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

  alSeleccionarImagen(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.toast.warning('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toast.warning('La imagen no debe superar los 5MB');
        return;
      }

      this.archivoSeleccionado = file;
      const reader = new FileReader();
      reader.onload = e => this.vistaPrevia = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  removerImagen() {
    this.archivoSeleccionado = null;
    this.vistaPrevia = null;
  }

  guardar() {
    if (!this.nombre.trim()) {
      return this.toast.warning('El nombre del producto es obligatorio');
    }
    if (!this.valor || this.valor <= 0) {
      return this.toast.warning('El precio debe ser mayor a 0');
    }
    if (this.stock === null || this.stock < 0) {
      return this.toast.warning('El stock debe ser un número válido');
    }

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const negocioId = usuario.negocioId;

    const formData = new FormData();
    formData.append('nombre', this.nombre.trim());
    formData.append('valor', this.valor.toString());
    formData.append('stock', this.stock.toString());
    formData.append('descripcion', this.descripcion.trim());

    if (negocioId) {
      formData.append('negocioId', negocioId);
    }

    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado);
    }

    this.guardando = true;
    this.productoService.crearProducto(formData).subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/admin/inventario']);
      },
      error: (err) => {
        this.guardando = false;
        const mensaje = err.error?.mensaje || err.message || 'Error al crear el producto';
        this.toast.warning('Error: ' + mensaje);
      }
    });
  }
}