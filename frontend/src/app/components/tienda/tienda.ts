import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TiendaService } from '../../services/tienda';
import { SocketService } from '../../services/socket';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tienda.html',
  styleUrls: ['./tienda.css']
})
export class Tienda implements OnInit, OnDestroy {
  productos: any[] = [];
  negocios: any[] = [];
  negocioSeleccionado: string = '';
  nuevosProductos: string[] = [];
  cargando = true;
  usuarioActual: any = null;
  private socketSub: any;

  constructor(
    private tiendaService: TiendaService,
    private socketService: SocketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef  // ← Agregado para forzar detección de cambios
  ) { }

  ngOnInit() {
    this.usuarioActual = this.authService.getSocioActual();
    this.cargarDatos();
    this.conectarWebSocket();
  }

  ngOnDestroy() {
    if (this.socketSub) {
      const socket = this.socketService.getSocket();
      socket?.off('nuevo_producto', this.socketSub);
    }
  }

  cargarDatos() {
    this.cargando = true;

    // Cargar productos
    this.tiendaService.obtenerProductos(this.negocioSeleccionado || undefined)
      .subscribe({
        next: (data) => {
          this.productos = data;
          this.cargando = false;
          this.cdr.detectChanges();  // ← Forzar detección de cambios
        },
        error: (err) => {
          console.error('Error cargando productos:', err);
          this.cargando = false;
          this.cdr.detectChanges();  // ← Forzar detección de cambios
        }
      });

    // Cargar negocios para el filtro
    this.tiendaService.obtenerNegocios()
      .subscribe({
        next: (data) => {
          this.negocios = data;
          this.cdr.detectChanges();  // ← Forzar detección de cambios
        },
        error: (err) => console.error('Error cargando negocios:', err)
      });
  }

  filtrarPorNegocio() {
    this.cargarDatos();
  }

  conectarWebSocket() {
    const socket = this.socketService.getSocket();
    if (!socket) return;

    this.socketSub = (producto: any) => {
      // Solo agregar si coincide con el filtro actual
      if (!this.negocioSeleccionado || producto.negocio?.slug === this.negocioSeleccionado) {
        this.productos.unshift(producto);
        this.nuevosProductos.push(producto.id);

        // Quitar indicador después de 10 segundos
        setTimeout(() => {
          this.nuevosProductos = this.nuevosProductos.filter(id => id !== producto.id);
          this.cdr.detectChanges();
        }, 10000);

        this.cdr.detectChanges();
      }
    };

    socket.on('nuevo_producto', this.socketSub);
  }

  productoEsNuevo(productoId: string): boolean {
    return this.nuevosProductos.includes(productoId);
  }

  mostrarNuevos() {
    const primerNuevo = document.querySelector('.ring-2');
    if (primerNuevo) {
      primerNuevo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    this.nuevosProductos = [];
  }

  // Método helper para verificar si hay sesión
  estaAutenticado(): boolean {
    return !!this.authService.getSocioActual();
  }

  irALogin() {
    window.location.href = '/login';
  }

  irARegistro() {
    window.location.href = '/registro';
  }

  irADashboard() {
    window.location.href = '/admin/dashboard';
  }

  cerrarSesion() {
    this.authService.logout();
    window.location.href = '/login';
  }
}