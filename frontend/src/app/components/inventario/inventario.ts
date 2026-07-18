import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { obtenerMensajeHttp } from '../../utils/http-error';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, AdminLayout],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class Inventario implements OnInit {
  productos: any[] = [];
  cargando = true;
  modalAbierto = false;
  productoEditando: any = null;
  usuarioActual: any = null;
  rolActual: string | null = null;
  guardando = false;
  desactivandoId: string | null = null;
  reactivandoId: string | null = null;
  estadoSeleccionado: 'activos' | 'desactivados' = 'activos';
  productoPorDesactivar: any = null;

  constructor(
    private toast: ToastService,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarInventario();
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

  cargarInventario() {
    this.cargando = true;
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const negocioId = localStorage.getItem('negocioSeleccionado') || usuario.negocioId || undefined;

    this.productoService.obtenerProductos(negocioId, this.estadoSeleccionado).subscribe({
      next: (data) => {
        this.productos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.toast.error(obtenerMensajeHttp(err, 'No fue posible cargar el inventario.'));
        this.cdr.detectChanges();
      }
    });
  }

  abrirModal(prod: any) {
    this.productoEditando = { ...prod };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.productoEditando = null;
  }

  guardarCambios() {
    if (!this.productoEditando || this.guardando) return;

    const nombre = String(this.productoEditando.nombre ?? '').trim();
    const valor = Number(this.productoEditando.valor);
    const stock = Number(this.productoEditando.stock);
    const descripcion = String(this.productoEditando.descripcion ?? '').trim();
    if (!nombre) return this.toast.warning('El nombre del producto es obligatorio.');
    if (nombre.length > 120) return this.toast.warning('El nombre no puede superar los 120 caracteres.');
    if (!Number.isFinite(valor) || valor <= 0) return this.toast.warning('El precio debe ser mayor a cero.');
    if (!Number.isInteger(stock) || stock < 0) return this.toast.warning('El stock debe ser un entero igual o mayor a cero.');
    if (descripcion.length > 500) return this.toast.warning('La descripción no puede superar los 500 caracteres.');

    this.productoEditando = { ...this.productoEditando, nombre, valor, stock, descripcion };
    this.guardando = true;

    this.productoService.actualizarProducto(this.productoEditando.id, this.productoEditando)
      .pipe(finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarInventario();
          this.toast.success('Producto actualizado correctamente.');
        },
        error: (err) => this.toast.error(obtenerMensajeHttp(err, 'No fue posible actualizar el producto.'))
      });
  }

  eliminarProducto(producto: any) {
    this.productoPorDesactivar = producto;
  }

  cerrarConfirmacionDesactivar() {
    if (!this.desactivandoId) this.productoPorDesactivar = null;
  }

  confirmarDesactivacion() {
    const producto = this.productoPorDesactivar;
    if (!producto || this.desactivandoId) return;
    this.desactivandoId = producto.id;
    this.productoService.eliminarProducto(producto.id, producto.negocioId).pipe(finalize(() => {
        this.desactivandoId = null;
        this.cdr.detectChanges();
      })).subscribe({
        next: () => {
          this.productos = this.productos.filter(item => item.id !== producto.id);
          this.productoPorDesactivar = null;
          this.toast.success('Producto desactivado correctamente.');
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(obtenerMensajeHttp(err, 'No fue posible desactivar el producto.'))
      });
  }

  cambiarEstado(estado: 'activos' | 'desactivados') {
    if (this.estadoSeleccionado === estado || this.cargando) return;
    this.estadoSeleccionado = estado;
    this.cargarInventario();
  }

  reactivarProducto(producto: any) {
    if (this.reactivandoId) return;
    this.reactivandoId = producto.id;
    this.productoService.reactivarProducto(producto.id, producto.negocioId).pipe(finalize(() => {
      this.reactivandoId = null;
      this.cdr.detectChanges();
    })).subscribe({
      next: () => {
        this.productos = this.productos.filter(item => item.id !== producto.id);
        this.toast.success('Producto reactivado correctamente.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(obtenerMensajeHttp(err, 'No fue posible reactivar el producto.'))
    });
  }

  // En tu crear-producto.ts
  esAdminOrSuperAdmin(): boolean {
    const rol = this.authService.getRole();
    return rol === 'ADMINISTRADOR' || rol === 'SUPERADMIN';
  }
}
