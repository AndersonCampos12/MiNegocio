import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  Subscription, debounceTime, distinctUntilChanged,
  switchMap, of, catchError  // ← añadir catchError
} from 'rxjs';
import { ProductoService } from '../../services/producto';
import { VentasService } from '../../services/ventas';
import { ClientesService } from '../../services/clientes';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [RouterLink, CommonModule, AdminLayout, ReactiveFormsModule],
  templateUrl: './caja.html',
  styleUrl: './caja.css'
})
export class Caja implements OnInit, OnDestroy {
  // Productos e Inventario
  productos: any[] = [];
  carrito: Map<string, { productoId: string; nombre: string; cantidad: number; precioUnit: number }> = new Map();

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

  // Modal de Registro Rápido de Cliente
  mostrarModalCliente = false;
  clienteForm = new FormGroup({
    cedula: new FormControl('', Validators.required),
    nombre: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email])
  });

  // Datos de Sesión y Usuario
  usuarioActual: any = null;
  rolActual: string | null = null;

  // Manejo centralizado de suscripciones para evitar fugas de memoria
  private subs = new Subscription();

  constructor(
    private productoService: ProductoService,
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarInventario();
    this.configurarBuscadorClientes();

    // Escucha en tiempo real de actualizaciones de stock vía WebSockets
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

  // --- GESTIÓN DE CLIENTES ---

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
            return of([] as any[]);  // ← cast explícito
          }

          this.buscandoCliente = true;
          this.cdr.detectChanges();

          return this.clientesService
            .buscarClientes(terminoLimpio, this.usuarioActual?.negocioId)
            .pipe(
              catchError(err => {
                console.error('Error al buscar clientes:', err);
                return of([] as any[]);  // ← cast explícito
              })
            );
        })
      ).subscribe({
        next: (resultados: any) => {  // ← any en lugar de any[]
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
    if (this.clienteForm.invalid) return;

    const nuevoCliente = {
      ...this.clienteForm.value,
      rol: 'CLIENTE',
      negocioId: this.usuarioActual.negocioId
    };

    this.clientesService.crearCliente(nuevoCliente).subscribe({
      next: (clienteCreado: any) => {
        this.seleccionarCliente(clienteCreado);
        this.mostrarModalCliente = false;
        alert('Cliente registrado exitosamente');
      },
      error: (err: any) => { // <-- Agregar : any aquí
        alert(`Error al crear cliente: ${err.error?.mensaje || err.message}`);
      }
    });
  }

  // --- GESTIÓN DEL CARRITO ---

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

  // --- FINALIZAR PROCESO DE VENTA ---

  finalizarVenta() {
    if (this.carrito.size === 0) {
      alert('El carrito está vacío');
      return;
    }
    if (!this.clienteSeleccionado) {
      alert('Debe seleccionar un cliente antes de facturar');
      return;
    }

    // Estructura completa del Payload adaptada al nuevo esquema del POS
    const payloadFactura = {
      clienteId: this.clienteSeleccionado.id,
      socioId: this.usuarioActual.id,
      negocioId: this.usuarioActual.negocioId,
      detalles: Array.from(this.carrito.values()),
      subtotal: this.subtotal,
      impuestos: this.montoIva,
      total: this.totalVenta
    };

    this.ventasService.registrarVenta(payloadFactura).subscribe({
      next: () => {
        alert('¡Venta realizada con éxito!');
        this.carrito.clear();
        this.quitarCliente();
        this.calcularTotales();
        this.cargarInventario();
      },
      error: (err: any) => { // <-- Agregar : any aquí
        alert(`Error en transacción: ${err.error?.mensaje || 'Error desconocido'}`);
      }
    });
  }

  ngOnDestroy() {
    // Desuscripción automática de todos los observables abiertos
    this.subs.unsubscribe();
  }
}