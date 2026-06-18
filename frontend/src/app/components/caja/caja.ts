import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Agregado ChangeDetectorRef
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProductoService } from '../../services/producto';
import { VentasService } from '../../services/ventas';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './caja.html',
  styleUrl: './caja.css'
})
export class Caja implements OnInit, OnDestroy {
  productos: any[] = [];
  carrito: Map<string, { productoId: string; nombre: string; cantidad: number; precioUnit: number }> = new Map();
  totalVenta = 0;
  cantidadItems = 0;
  private stockSub!: Subscription;

  constructor(
    private productoService: ProductoService,
    private ventasService: VentasService,
    private cdr: ChangeDetectorRef // Inyectamos cdr
  ) { }

  ngOnInit() {
    this.cargarInventario();

    this.stockSub = this.ventasService.onStockActualizado().subscribe((data) => {
      const prodIndex = this.productos.findIndex(p => p.id === data.productoId);
      if (prodIndex !== -1) {
        this.productos[prodIndex].stock = data.nuevoStock;
        this.cdr.detectChanges(); // Refresca la vista del nuevo stock
      }
    });
  }

  cargarInventario() {
    this.productoService.obtenerProductos().subscribe((data: any) => {
      this.productos = data;
      this.cdr.detectChanges(); // Asegura que los productos carguen a la primera
    });
  }

  agregarAlCarrito(prod: any) {
    if (prod.stock <= 0) return alert('No queda stock disponible de este producto');

    if (this.carrito.has(prod.id)) {
      const item = this.carrito.get(prod.id)!;
      if (item.cantidad >= prod.stock) return alert('No puedes agregar más del stock existente');
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

  calcularTotales() {
    this.totalVenta = 0;
    this.cantidadItems = 0;
    this.carrito.forEach(item => {
      this.totalVenta += item.cantidad * item.precioUnit;
      this.cantidadItems += item.cantidad;
    });
  }

  finalizarVenta() {
    if (this.carrito.size === 0) return alert('El carrito está vacío');

    const detallesArray = Array.from(this.carrito.values());

    // Le mandamos el arreglo directo para que TypeScript esté feliz
    this.ventasService.registrarVenta(detallesArray).subscribe({
      next: () => {
        alert('¡Venta realizada con éxito!');
        this.carrito.clear();
        this.calcularTotales();
        this.cargarInventario();
      },
      error: (err) => alert(`Error en transacción: ${err.error?.mensaje}`)
    });
  }

  ngOnDestroy() {
    if (this.stockSub) this.stockSub.unsubscribe();
  }
}