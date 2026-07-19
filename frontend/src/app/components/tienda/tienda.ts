import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TiendaService } from '../../services/tienda';
import { SocketService } from '../../services/socket';
import { AuthService } from '../../services/auth';
import { CarritoService } from '../../services/carrito';
import { PedidosService } from '../../services/pedidos';
import { ToastService } from '../../services/toast';
import { ReporteService } from '../../services/reporte';

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
  pedidosCheckout: any[] = [];
  creandoPedidos = false;
  pagoEnProceso: string | null = null;
  checkoutAbierto = false;
  cancelandoPedidos = false;
  compraExitosa = false;
  busqueda = '';
  disponibilidad = 'todos';
  ordenProductos = 'recientes';

  // Carrusel
  slideActual: number = 0;

  constructor(
    private tiendaService: TiendaService,
    private socketService: SocketService,
    private authService: AuthService,
    private carritoService: CarritoService,
    private pedidosService: PedidosService,
    private toast: ToastService,
    private reporteService: ReporteService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.usuarioActual = this.authService.getSocioActual();
    this.cargarDatos();
    this.conectarWebSocket();
    this.recuperarCheckout();
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
    const existente = this.carrito.find(item => item.id === producto.id);
    if (producto.stock <= 0 || (existente?.cantidad || 0) >= producto.stock) {
      this.toast.warning(`Solo hay ${producto.stock} unidad(es) disponibles de ${producto.nombre}`);
      return;
    }
    this.carritoService.agregarProducto(producto);
    this.toast.success(`${producto.nombre} agregado al carrito`);
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
    const producto = this.carrito.find(item => item.id === productoId);
    if (producto && cantidad > producto.stock) {
      this.toast.warning(`Solo hay ${producto.stock} unidad(es) disponibles`);
      return;
    }
    this.carritoService.actualizarCantidad(productoId, cantidad);
  }

  get productosFiltrados(): any[] {
    const termino = this.normalizarTexto(this.busqueda);
    const filtrados = this.productos.filter(producto => {
      const coincideTexto = !termino || this.normalizarTexto(
        `${producto.nombre} ${producto.descripcion || ''} ${producto.negocio?.nombre || ''}`
      ).includes(termino);
      const coincideStock = this.disponibilidad === 'todos'
        || (this.disponibilidad === 'disponibles' && producto.stock > 0)
        || (this.disponibilidad === 'agotados' && producto.stock === 0);
      return coincideTexto && coincideStock;
    });

    return filtrados.sort((a, b) => {
      if (this.ordenProductos === 'precio_asc') return Number(a.valor) - Number(b.valor);
      if (this.ordenProductos === 'precio_desc') return Number(b.valor) - Number(a.valor);
      if (this.ordenProductos === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
      return new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime();
    });
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.disponibilidad = 'todos';
    this.ordenProductos = 'recientes';
    this.negocioSeleccionado = '';
    this.cargarDatos();
  }

  private normalizarTexto(valor: string): string {
    return valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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

  crearPedidos() {
    if (this.usuarioActual?.rol !== 'CLIENTE') {
      this.toast.warning('Debes ingresar con una cuenta de cliente para comprar');
      return;
    }
    if (this.pedidosCheckout.length > 0) {
      this.carritoAbierto = false;
      this.checkoutAbierto = true;
      return;
    }
    if (this.carrito.length === 0 || this.creandoPedidos) return;

    this.creandoPedidos = true;
    const items = this.carrito.map(item => ({ productoId: item.id, cantidad: item.cantidad }));
    this.pedidosService.crear(items).subscribe({
      next: pedidos => {
        this.pedidosCheckout = pedidos;
        localStorage.setItem('pedidos_checkout', JSON.stringify(pedidos));
        this.creandoPedidos = false;
        this.carritoAbierto = false;
        this.checkoutAbierto = true;
        this.cdr.detectChanges();
        this.toast.success(pedidos.length > 1
          ? `Se crearon ${pedidos.length} pedidos, uno por negocio`
          : 'Pedido creado correctamente');
      },
      error: err => {
        this.creandoPedidos = false;
        this.toast.error(err.error?.mensaje || 'No se pudo crear el pedido');
      }
    });
  }

  cerrarCheckout() {
    if (this.pagoEnProceso) return;
    this.checkoutAbierto = false;
  }

  abrirCheckout() {
    if (this.pedidosCheckout.length === 0) return;
    this.carritoAbierto = false;
    this.checkoutAbierto = true;
  }

  volverAlCarrito() {
    this.checkoutAbierto = false;
    this.carritoAbierto = true;
  }

  cancelarCheckout() {
    if (this.pagoEnProceso || this.cancelandoPedidos) return;
    this.cancelandoPedidos = true;
    const pendientes = [...this.pedidosCheckout];
    let completados = 0;

    for (const pedido of pendientes) {
      this.pedidosService.cancelar(pedido.id).subscribe({
        next: () => {
          completados += 1;
          this.quitarPedidoCheckout(pedido.id);
          if (completados === pendientes.length) {
            this.cancelandoPedidos = false;
            this.checkoutAbierto = false;
            localStorage.removeItem('pago_checkout_activo');
            this.toast.info('Checkout cancelado. Tu carrito sigue disponible');
            this.cdr.detectChanges();
          }
        },
        error: err => {
          completados += 1;
          this.quitarPedidoCheckout(pedido.id);
          if (completados === pendientes.length) {
            this.cancelandoPedidos = false;
            this.checkoutAbierto = false;
            this.toast.warning(err.error?.mensaje || 'El checkout se cerró, pero un pedido no pudo cancelarse');
            this.cdr.detectChanges();
          }
        }
      });
    }
  }

  cerrarCompraExitosa() {
    this.compraExitosa = false;
  }

  private quitarPedidoCheckout(pedidoId: string) {
    this.pedidosCheckout = this.pedidosCheckout.filter(pedido => pedido.id !== pedidoId);
    localStorage.setItem('pedidos_checkout', JSON.stringify(this.pedidosCheckout));
  }

  pagar(pedido: any, proveedor: 'PAYPAL' | 'PAYPHONE') {
    if (this.pagoEnProceso) return;
    this.pagoEnProceso = pedido.id;
    this.pedidosService.iniciarPago(pedido.id, proveedor).subscribe({
      next: respuesta => {
        localStorage.setItem('pago_checkout_activo', JSON.stringify({
          pedidoId: pedido.id,
          proveedor,
          referencia: respuesta.referencia,
          productos: pedido.detalles.map((detalle: any) => detalle.productoId)
        }));
        window.location.href = respuesta.url;
      },
      error: err => {
        this.pagoEnProceso = null;
        this.toast.error(err.error?.mensaje || 'No se pudo iniciar el pago');
      }
    });
  }

  private recuperarCheckout() {
    const pedidosGuardados = localStorage.getItem('pedidos_checkout');
    this.pedidosCheckout = pedidosGuardados ? JSON.parse(pedidosGuardados) : [];
    this.checkoutAbierto = this.pedidosCheckout.length > 0;

    const pagoGuardado = localStorage.getItem('pago_checkout_activo');
    if (!pagoGuardado) return;
    const pago = JSON.parse(pagoGuardado);
    const parametros = new URLSearchParams(window.location.search);

    if (parametros.get('paypal') === 'cancelado' || parametros.get('payphone') === 'cancelado') {
      this.pedidosService.cancelar(pago.pedidoId).subscribe({ error: () => undefined });
      this.pedidosCheckout = this.pedidosCheckout.filter(pedido => pedido.id !== pago.pedidoId);
      this.checkoutAbierto = this.pedidosCheckout.length > 0;
      localStorage.setItem('pedidos_checkout', JSON.stringify(this.pedidosCheckout));
      localStorage.removeItem('pago_checkout_activo');
      window.history.replaceState({}, '', '/tienda');
      this.toast.info('Pago cancelado. Puedes generar un nuevo pedido');
      this.cdr.detectChanges();
      return;
    }

    if (pago.proveedor === 'PAYPAL' && parametros.get('paypal') === 'aprobado') {
      const orderId = parametros.get('token');
      if (orderId && orderId === pago.referencia) {
        this.pagoEnProceso = pago.pedidoId;
        this.pedidosService.capturarPaypal(pago.pedidoId, orderId).subscribe({
          next: resultado => this.finalizarPagoLocal(pago, resultado.venta?.id),
          error: err => this.falloConfirmacion(err)
        });
      }
    }

    if (pago.proveedor === 'PAYPHONE' && parametros.get('payphone') === 'confirmar') {
      const id = Number(parametros.get('id'));
      const clientTransactionId = parametros.get('clientTransactionId') || '';
      if (Number.isInteger(id) && clientTransactionId === pago.referencia) {
        this.pagoEnProceso = pago.pedidoId;
        this.pedidosService.confirmarPayphone(pago.pedidoId, id, clientTransactionId).subscribe({
          next: resultado => this.finalizarPagoLocal(pago, resultado.venta?.id),
          error: err => this.falloConfirmacion(err)
        });
      }
    }
  }

  private finalizarPagoLocal(pago: any, ventaId?: string) {
    this.carritoService.eliminarProductos(pago.productos);
    this.pedidosCheckout = this.pedidosCheckout.filter(pedido => pedido.id !== pago.pedidoId);
    this.checkoutAbierto = this.pedidosCheckout.length > 0;
    localStorage.setItem('pedidos_checkout', JSON.stringify(this.pedidosCheckout));
    localStorage.removeItem('pago_checkout_activo');
    this.pagoEnProceso = null;
    this.compraExitosa = true;
    window.history.replaceState({}, '', '/tienda');
    this.toast.success('Pago confirmado. La venta y la factura fueron generadas');
    this.cdr.detectChanges();
    if (ventaId) {
      this.reporteService.enviarFacturaPorCorreo(ventaId).subscribe({
        next: () => this.toast.success('Factura enviada por correo'),
        error: () => this.toast.warning('La compra se confirmó, pero no se pudo enviar la factura')
      });
    }
  }

  private falloConfirmacion(err: any) {
    this.pagoEnProceso = null;
    window.history.replaceState({}, '', '/tienda');
    this.toast.error(err.error?.mensaje || 'El proveedor todavía no confirmó el pago');
    this.cdr.detectChanges();
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
