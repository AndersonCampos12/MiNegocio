import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProductoService } from '../../services/producto';
import { VentasService } from '../../services/ventas';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [RouterLink, CommonModule, AdminLayout],
  templateUrl: './caja.html',
  styleUrl: './caja.css'
})
export class Caja implements OnInit, OnDestroy {
  productos: any[] = [];
  carrito: Map<string, { productoId: string; nombre: string; cantidad: number; precioUnit: number }> = new Map();
  totalVenta = 0;
  cantidadItems = 0;
  usuarioActual: any = null;
  rolActual: string | null = null;
  private stockSub!: Subscription;

  constructor(
    private productoService: ProductoService,
    private ventasService: VentasService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarInventario();
    this.stockSub = this.ventasService.onStockActualizado().subscribe((data) => {
      const prodIndex = this.productos.findIndex(p => p.id === data.productoId);
      if (prodIndex !== -1) {
        this.productos[prodIndex].stock = data.nuevoStock;
        this.cdr.detectChanges();
      }
    });
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
    const usuarioString = localStorage.getItem('usuario');
    let negocioId = '';
    if (usuarioString) {
      const usuario = JSON.parse(usuarioString);
      negocioId = localStorage.getItem('negocioSeleccionado') || usuario.negocioId;
    }
    this.productoService.obtenerProductos(negocioId).subscribe({
      next: (data: any) => {
        this.productos = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar inventario en caja:', err);
      }
    });
  }

  agregarAlCarrito(prod: any) {
    if (prod.stock <= 0) {
      alert('No queda stock disponible de este producto');
      return;
    }

    if (this.carrito.has(prod.id)) {
      const item = this.carrito.get(prod.id)!;
      if (item.cantidad >= prod.stock) {
        alert('No puedes agregar más del stock existente');
        return;
      }
      item.cantidad++;
    } else {
      this.carrito.set(prod.id, {
        productoId: prod.id,
        nombre: prod.nombre,
        cantidad: 1,
        precioUnit: prod.valor
      });
    }
    this.calcularTotales();
  }

  removerDelCarrito(productoId: string) {
    if (this.carrito.has(productoId)) {
      const item = this.carrito.get(productoId)!;
      if (item.cantidad > 1) {
        item.cantidad--;
      } else {
        this.carrito.delete(productoId);
      }
      this.calcularTotales();
    }
  }

  calcularTotales() {
    this.totalVenta = 0;
    this.cantidadItems = 0;
    this.carrito.forEach(item => {
      this.totalVenta += item.cantidad * item.precioUnit;
      this.cantidadItems += item.cantidad;
    });
  }

  finalizarVenta() {
    if (this.carrito.size === 0) {
      alert('El carrito está vacío');
      return;
    }

    const detallesArray = Array.from(this.carrito.values());
    this.ventasService.registrarVenta(detallesArray).subscribe({
      next: () => {
        alert('¡Venta realizada con éxito!');
        this.carrito.clear();
        this.calcularTotales();
        this.cargarInventario();
      },
      error: (err) => {
        alert(`Error en transacción: ${err.error?.mensaje || 'Error desconocido'}`);
      }
    });
  }

  ngOnDestroy() {
    if (this.stockSub) {
      this.stockSub.unsubscribe();
    }
  }
}