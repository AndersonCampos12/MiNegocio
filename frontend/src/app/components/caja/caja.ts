import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  Subscription, debounceTime, distinctUntilChanged,
  switchMap, of, catchError, finalize
} from 'rxjs';
import { ProductoService } from '../../services/producto';
import { VentasService } from '../../services/ventas';
import { ClientesService } from '../../services/clientes';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastService } from '../../services/toast';
import { obtenerMensajeHttp } from '../../utils/http-error';
import { ReporteService } from '../../services/reporte';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [RouterLink, CommonModule, AdminLayout, ReactiveFormsModule, FormsModule],
  templateUrl: './caja.html',
  styleUrl: './caja.css'
})
export class Caja implements OnInit, OnDestroy {
  // Productos e Inventario
  productos: any[] = [];
  carrito: Map<string, { productoId: string; nombre: string; cantidad: number; precioUnit: number }> = new Map();

  mostrarVisor = false;
  urlFacturaSegura: SafeResourceUrl | null = null;
  ventaSeleccionadaId: string | null = null;
  descargandoFactura = false;

  // Totales e Impuestos (IVA 15%)
  subtotal = 0;
  montoIva = 0;
  totalVenta = 0;
  cantidadItems = 0;
  readonly PORCENTAJE_IVA = 0.15;

  // Búsqueda de Clientes
  buscadorCliente = new FormControl('');
  resultadosClientes: any[] = [];
  clienteSeleccionado: any = null;
  buscandoCliente = false;

  // NUEVO: Control para el método de pago (Efectivo, PayPhone, Kushki)
  metodoPagoSeleccionado = 'EFECTIVO';

  // Modal de Registro Rápido de Cliente
  mostrarModalCliente = false;
  clienteForm = new FormGroup({
    cedula: new FormControl('', [Validators.required, Validators.pattern(/^\d{10}(\d{3})?$/)]),
    nombre: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(254)])
  });
  guardandoCliente = false;

  // Datos de Sesión y Usuario
  usuarioActual: any = null;
  rolActual: string | null = null;

  private subs = new Subscription();

  constructor(
    private toast: ToastService,
    private productoService: ProductoService,
    private ventasService: VentasService,
    private reporteService: ReporteService,
    private clientesService: ClientesService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarInventario();
    this.configurarBuscadorClientes();
    this.limpiarErroresDuplicadosAlEditar();

    this.subs.add(
      this.ventasService.onStockActualizado().subscribe((data) => {
        const prodIndex = this.productos.findIndex(p => p.id === data.productoId);
        if (prodIndex !== -1) {
          this.productos[prodIndex].stock = data.nuevoStock;
          this.cdr.detectChanges();
        }
      })
    );
  }

  private limpiarErroresDuplicadosAlEditar() {
    const controles = [this.clienteForm.controls.email, this.clienteForm.controls.cedula];

    controles.forEach(control => {
      this.subs.add(control.valueChanges.subscribe(() => {
        if (!control.hasError('duplicado')) return;

        const { duplicado, ...otrosErrores } = control.errors ?? {};
        control.setErrors(Object.keys(otrosErrores).length ? otrosErrores : null, { emitEvent: false });
      }));
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
    let negocioId = '';
    if (this.usuarioActual) {
      negocioId = localStorage.getItem('negocioSeleccionado') || this.usuarioActual.negocioId;
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

  configurarBuscadorClientes() {
    this.subs.add(
      this.buscadorCliente.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(termino => {
          const terminoLimpio = termino?.trim() ?? '';

          if (terminoLimpio.length < 2) {
            this.buscandoCliente = false;
            this.resultadosClientes = [];
            this.cdr.detectChanges();
            return of([] as any[]);
          }

          this.buscandoCliente = true;
          this.cdr.detectChanges();

          return this.clientesService
            .buscarClientes(terminoLimpio, this.usuarioActual?.negocioId)
            .pipe(
              catchError(err => {
                console.error('Error al buscar clientes:', err);
                return of([] as any[]);
              })
            );
        })
      ).subscribe({
        next: (resultados: any) => {
          this.resultadosClientes = resultados;
          this.buscandoCliente = false;
          this.cdr.detectChanges();
        }
      })
    );
  }

  seleccionarCliente(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.buscadorCliente.setValue('', { emitEvent: false });
    this.resultadosClientes = [];
  }

  quitarCliente() {
    this.clienteSeleccionado = null;
  }

  abrirModalCliente() {
    this.mostrarModalCliente = true;
    this.clienteForm.reset();
  }

  guardarNuevoCliente() {
    if (this.guardandoCliente) return;

    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const nuevoCliente = {
      ...this.clienteForm.value,
      nombre: this.clienteForm.controls.nombre.value?.trim(),
      email: this.clienteForm.controls.email.value?.trim().toLowerCase(),
      cedula: this.clienteForm.controls.cedula.value?.trim()
    };

    this.guardandoCliente = true;
    this.cdr.detectChanges();

    this.clientesService.crearCliente(nuevoCliente).pipe(
      finalize(() => {
        this.guardandoCliente = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (resultado: any) => {
        this.seleccionarCliente(resultado.cliente);
        this.mostrarModalCliente = false;
        this.toast.success(resultado.mensaje || 'Cliente agregado correctamente');
      },
      error: (err: any) => {
        const mensaje = obtenerMensajeHttp(err, 'No fue posible registrar el cliente.');
        if (/correo/i.test(mensaje)) this.clienteForm.controls.email.setErrors({ duplicado: true });
        if (/cédula|RUC/i.test(mensaje)) this.clienteForm.controls.cedula.setErrors({ duplicado: true });
        this.toast.error(mensaje);
        this.cdr.detectChanges();
      }
    });
  }

  agregarAlCarrito(prod: any) {
    if (prod.stock <= 0) {
      this.toast.warning('No queda stock disponible de este producto');
      return;
    }

    if (this.carrito.has(prod.id)) {
      const item = this.carrito.get(prod.id)!;
      if (item.cantidad >= prod.stock) {
        this.toast.warning('No puedes agregar más del stock existente');
        return;
      }
      item.cantidad++;
    } else {
      this.carrito.set(prod.id, {
        productoId: prod.id,
        nombre: prod.nombre,
        cantidad: 1,
        precioUnit: Number(prod.valor)
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
      item.cantidad === 0 ? this.carrito.delete(productoId) : null;
      this.calcularTotales();
    }
  }

  calcularTotales() {
    this.subtotal = 0;
    this.cantidadItems = 0;

    this.carrito.forEach(item => {
      this.subtotal += item.cantidad * item.precioUnit;
      this.cantidadItems += item.cantidad;
    });

    this.montoIva = this.subtotal * this.PORCENTAJE_IVA;
    this.totalVenta = this.subtotal + this.montoIva;
  }

  ejecutarImpresionFactura(ventaId: string) {
    const urlFactura = `http://localhost:3000/api/reportes/factura/${ventaId}?autoImprimir=false&estilo=moderno`;
    // Marcamos la URL como segura para que el iframe pueda renderizarla
    this.ventaSeleccionadaId = ventaId;
    this.urlFacturaSegura = this.sanitizer.bypassSecurityTrustResourceUrl(urlFactura);
    this.mostrarVisor = true;
    this.cdr.detectChanges();
  }

  descargarFacturaSeleccionada() {
    if (!this.ventaSeleccionadaId || this.descargandoFactura) return;

    const ventaId = this.ventaSeleccionadaId;
    const numeroFactura = ventaId.split('-')[0].toUpperCase();
    this.descargandoFactura = true;

    this.subs.add(
      this.reporteService.descargarFacturaPdf(ventaId).subscribe({
        next: (pdf) => {
          const url = URL.createObjectURL(pdf);
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = `factura-${numeroFactura}.pdf`;
          enlace.click();
          URL.revokeObjectURL(url);
          this.descargandoFactura = false;
          this.toast.success('Factura descargada correctamente');
        },
        error: (err) => {
          console.error('Error descargando factura:', err);
          this.descargandoFactura = false;
          this.toast.error('No se pudo descargar la factura');
        }
      })
    );
  }

  cerrarVisor() {
    this.mostrarVisor = false;
    this.urlFacturaSegura = null;
    this.ventaSeleccionadaId = null;
  }

  finalizarVenta() {
    if (this.carrito.size === 0) {
      this.toast.warning('El carrito está vacío');
      return;
    }
    if (!this.clienteSeleccionado) {
      this.toast.warning('Debe seleccionar un cliente antes de facturar');
      return;
    }

    const payloadFactura = {
      clienteId: this.clienteSeleccionado.id,
      socioId: this.usuarioActual.id,
      negocioId: this.usuarioActual.negocioId,
      detalles: Array.from(this.carrito.values()),
      subtotal: this.subtotal,
      impuestos: this.montoIva,
      total: this.totalVenta,
      metodoPago: this.metodoPagoSeleccionado // <-- Enviamos el método seleccionado
    };

    this.ventasService.registrarVenta(payloadFactura).subscribe({
      next: (resultadoVenta: any) => {
        this.toast.warning('¡Venta realizada con éxito! Generando factura...');

        // 🚀 EJECUCIÓN AUTOMÁTICA: Si el backend retorna el objeto creado con su ID (resultadoVenta.id)
        if (resultadoVenta && resultadoVenta.id) {
          this.ejecutarImpresionFactura(resultadoVenta.id);
          this.subs.add(
            this.reporteService.enviarFacturaPorCorreo(resultadoVenta.id).subscribe({
              next: () => {
                this.toast.success('¡Factura enviada por correo correctamente!');
              },
              error: (err: any) => {
                console.error('Error enviando factura por correo:', err);
                this.toast.warning('La venta se realizó, pero no se pudo enviar la factura por correo');
              }
            })
          );
        }

        // Limpieza de caja
        this.carrito.clear();
        this.quitarCliente();
        this.metodoPagoSeleccionado = 'EFECTIVO';
        this.calcularTotales();
        this.cargarInventario();
      },
      error: (err: any) => {
        console.log(`Error en transacción: ${err.error?.mensaje || 'Error desconocido'}`);
      }
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
