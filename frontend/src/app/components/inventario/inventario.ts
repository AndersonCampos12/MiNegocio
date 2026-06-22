import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';

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

  constructor(
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
    const negocioId = usuario.negocioId ?? undefined;

    this.productoService.obtenerProductos(negocioId).subscribe({
      next: (data) => {
        this.productos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
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
    if (!this.productoEditando) return;

    this.productoService.actualizarProducto(this.productoEditando.id, this.productoEditando)
      .subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarInventario();
        },
        error: (err) => alert('Error al actualizar el producto')
      });
  }

  eliminarProducto(id: string) {
    if (confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      this.productoService.eliminarProducto(id).subscribe({
        next: () => {
          this.cargarInventario();
        },
        error: (err) => alert('Error al eliminar el producto')
      });
    }
  }
}