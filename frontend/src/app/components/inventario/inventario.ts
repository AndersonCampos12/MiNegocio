import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- IMPORTANTE PARA EL MODAL
import { ProductoService } from '../../services/producto';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule], // <-- Agrégalo aquí también
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class Inventario implements OnInit {
  productos: any[] = [];

  // Variables para el modal de edición
  modalAbierto = false;
  productoEditando: any = null;

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarInventario();
  }

  cargarInventario() {
    this.productoService.obtenerProductos().subscribe({
      next: (data: any[]) => {
        // Filtramos en el frontend para asegurarnos de no mostrar los eliminados
        this.productos = data.filter(p => p.activo !== false);
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error(err)
    });
  }

  // --- MÉTODOS DEL CRUD ---

  abrirModal(prod: any) {
    this.productoEditando = { ...prod }; // Hacemos una copia exacta
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
          this.cargarInventario(); // Recargamos para ver los cambios
        },
        error: (err) => alert('Error al actualizar')
      });
  }

  eliminarProducto(id: string) {
    if (confirm('¿Estás seguro de retirar este producto del inventario?')) {
      this.productoService.eliminarProducto(id).subscribe({
        next: () => {
          this.cargarInventario(); // Recargamos y el producto desaparecerá
        },
        error: (err) => alert('Error al eliminar')
      });
    }
  }
}