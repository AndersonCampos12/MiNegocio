import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TiendaService } from '../../services/tienda';
import { SocketService } from '../../services/socket';
import { AuthService } from '../../services/auth';
import { CarritoService } from '../../services/carrito';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tienda.html',
  styleUrls: ['./tienda.css']
})
export class Tienda implements OnInit, OnDestroy {
  productos: any[] = [];
  masVendidos: any[] = [];
  ultimosProductos: any[] = [];
  negocios: any[] = [];
  negocioSeleccionado: string = '';
  nuevosProductos: string[] = [];
  cargando: boolean = true;
  usuarioActual: any = null;
  carritoAbierto: boolean = false;
  productoSeleccionado: any = null;
  modalDetalleAbierto: boolean = false;
  private socketSub: any;

  // Carrusel
  slideActual: number = 0;

  constructor(
    private tiendaService: TiendaService,
    private socketService: SocketService,
    private authService: AuthService,
    private carritoService: CarritoService,
    private cdr: ChangeDetectorRef
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

    this.tiendaService.obtenerProductos(this.negocioSeleccionado || undefined)
      .subscribe({
        next: (data: any[]) => {
          this.productos = data;
          // Últimos 5 para el carrusel
          this.ultimosProductos = data.slice(0, 5);
          // Simular más vendidos (menor stock = más vendido)
          this.masVendidos = [...data]
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 8);
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error cargando productos:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });

    this.tiendaService.obtenerNegocios()
      .subscribe({
        next: (data: any[]) => {
          this.negocios = data;
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error('Error cargando negocios:', err)
      });
  }

  filtrarPorNegocio() {
    this.cargarDatos();
  }

  conectarWebSocket() {
    const socket = this.socketService.getSocket();
    if (!socket) return;

    this.socketSub = (producto: any) => {
      if (!this.negocioSeleccionado || producto.negocio?.slug === this.negocioSeleccionado) {
        this.productos.unshift(producto);
        this.ultimosProductos.unshift(producto);
        if (this.ultimosProductos.length > 5) this.ultimosProductos.pop();
        this.nuevosProductos.push(producto.id);

        setTimeout(() => {
          this.nuevosProductos = this.nuevosProductos.filter(id => id !== producto.id);
          this.cdr.detectChanges();
        }, 10000);

        this.cdr.detectChanges();
      }
    };

    socket.on('nuevo_producto', this.socketSub);
  }

  // === CARRUSEL ===
  siguienteSlide() {
    this.slideActual = (this.slideActual + 1) % this.ultimosProductos.length;
  }

  anteriorSlide() {
    this.slideActual = (this.slideActual - 1 + this.ultimosProductos.length) % this.ultimosProductos.length;
  }

  irASlide(index: number) {
    this.slideActual = index;
  }

  // === CARRITO ===
  toggleCarrito() {
    this.carritoAbierto = !this.carritoAbierto;
  }

  agregarAlCarrito(producto: any, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.carritoService.agregarProducto(producto);
    // Animación breve
    const boton = event?.target as HTMLElement;
    if (boton) {
      boton.classList.add('scale-90');
      setTimeout(() => boton.classList.remove('scale-90'), 150);
    }
  }

  eliminarDelCarrito(productoId: string) {
    this.carritoService.eliminarProducto(productoId);
  }

  actualizarCantidad(productoId: string, cantidad: number) {
    this.carritoService.actualizarCantidad(productoId, cantidad);
  }

  get carrito(): any[] {
    return this.carritoService.obtenerCarrito();
  }

  get totalCarrito(): number {
    return this.carritoService.obtenerTotal();
  }

  get itemsCarrito(): number {
    return this.carritoService.contarItems();
  }

  // === DETALLE PRODUCTO ===
  abrirDetalle(producto: any) {
    this.productoSeleccionado = producto;
    this.modalDetalleAbierto = true;
  }

  cerrarDetalle() {
    this.modalDetalleAbierto = false;
    this.productoSeleccionado = null;
  }

  // === UTILIDADES ===
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