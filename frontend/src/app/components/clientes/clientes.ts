import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';
import { ClientesService } from '../../services/clientes';
import { ToastService } from '../../services/toast';
import { obtenerMensajeHttp } from '../../utils/http-error';
import { NegociosService } from '../../services/negocios';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminLayout],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class Clientes implements OnInit {
  usuarioActual: any = null;
  rolActual: string | null = null;
  clientes: any[] = [];
  cargando = false;
  guardando = false;
  procesandoId: string | null = null;
  filtroTexto = '';
  estadoSeleccionado: 'activos' | 'inactivos' | 'todos' = 'activos';
  mostrarModal = false;
  clienteEditando: any = null;
  clientePorCambiar: any = null;
  formulario = this.formularioVacio();
  negocios: any[] = [];
  negocioSeleccionado = '';

  constructor(
    private authService: AuthService,
    private clientesService: ClientesService,
    private negociosService: NegociosService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.rolActual = this.authService.getRole();
    this.usuarioActual = this.authService.getSocioActual();
    if (this.esSuperadmin) {
      this.negociosService.obtenerTodos().subscribe({
        next: negocios => {
          this.negocios = negocios;
          this.cargarClientes();
        },
        error: err => {
          this.toast.error(obtenerMensajeHttp(err, 'No fue posible cargar los negocios.'));
          this.cargarClientes();
        }
      });
    } else {
      this.cargarClientes();
    }
  }

  get esSuperadmin(): boolean {
    return this.rolActual === 'SUPERADMIN';
  }

  get clientesFiltrados() {
    const texto = this.filtroTexto.trim().toLowerCase();
    return this.clientes.filter(cliente => !texto || [cliente.nombre, cliente.cedula, cliente.email, cliente.negocioNombre]
      .some(valor => String(valor ?? '').toLowerCase().includes(texto)));
  }

  get clientesConCuenta(): number {
    return this.clientes.filter(cliente => cliente.cuentaActivada).length;
  }

  get totalCompras(): number {
    return this.clientes.reduce((total, cliente) => total + Number(cliente.totalCompras || 0), 0);
  }

  cargarClientes() {
    this.cargando = true;
    this.clientesService.obtenerClientes(this.estadoSeleccionado, this.negocioSeleccionado || undefined).subscribe({
      next: clientes => {
        this.clientes = clientes;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.cargando = false;
        this.toast.error(obtenerMensajeHttp(err, 'No fue posible cargar los clientes.'));
        this.cdr.detectChanges();
      }
    });
  }

  cambiarFiltroEstado(estado: 'activos' | 'inactivos' | 'todos') {
    if (this.estadoSeleccionado === estado || this.cargando) return;
    this.estadoSeleccionado = estado;
    this.cargarClientes();
  }

  abrirModal(cliente?: any) {
    this.clienteEditando = cliente || null;
    this.formulario = cliente
      ? {
          nombre: cliente.nombre,
          cedula: cliente.cedula || '',
          email: cliente.email,
          negocioId: cliente.negocioId,
          cuentaActivada: Boolean(cliente.cuentaActivada),
          password: ''
        }
      : this.formularioVacio();
    this.mostrarModal = true;
  }

  cerrarModal() {
    if (this.guardando) return;
    this.mostrarModal = false;
    this.clienteEditando = null;
  }

  guardar() {
    if (this.guardando) return;
    const nombre = this.formulario.nombre.trim();
    const cedula = this.formulario.cedula.trim();
    const email = this.formulario.email.trim().toLowerCase();
    const password = this.formulario.password;
    const cuentaActivada = this.formulario.cuentaActivada;
    const negocioId = this.esSuperadmin
      ? (this.clienteEditando?.negocioId || this.formulario.negocioId)
      : undefined;

    if (nombre.length < 2 || nombre.length > 100) return this.toast.warning('El nombre debe tener entre 2 y 100 caracteres.');
    if (!this.clienteEditando && !/^\d{10}(\d{3})?$/.test(cedula)) return this.toast.warning('Ingresa una cédula de 10 dígitos o un RUC de 13 dígitos.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.toast.warning('Ingresa un correo electrónico válido.');
    if (this.esSuperadmin && !negocioId) return this.toast.warning('Selecciona el negocio al que pertenecerá el cliente.');
    if (cuentaActivada && (!this.clienteEditando || !this.clienteEditando.cuentaActivada) && password.length < 8) {
      return this.toast.warning('La contraseña debe tener al menos 8 caracteres para habilitar la cuenta.');
    }
    if (cuentaActivada && password && password.length < 8) return this.toast.warning('La contraseña debe tener al menos 8 caracteres.');

    const estabaEditando = Boolean(this.clienteEditando);
    const passwordAsignada = cuentaActivada && password ? password : '';
    this.guardando = true;
    const peticion = this.clienteEditando
      ? this.clientesService.actualizarCliente(
          this.clienteEditando.membresiaId,
          { nombre, email, cuentaActivada, ...(cuentaActivada && password ? { password } : {}) },
          negocioId
        )
      : this.clientesService.crearCliente({ nombre, cedula, email, cuentaActivada, ...(cuentaActivada && password ? { password } : {}) }, negocioId);

    peticion.pipe(finalize(() => {
      this.guardando = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (resultado: any) => {
        this.cerrarModal();
        this.cargarClientes();
        const mensaje = resultado.mensaje || (estabaEditando ? 'Cliente actualizado correctamente.' : 'Cliente registrado correctamente.');
        this.toast.success(passwordAsignada && resultado.passwordActualizada
          ? `${mensaje} Contraseña asignada: ${passwordAsignada}`
          : mensaje);
      },
      error: err => this.toast.error(obtenerMensajeHttp(err, 'No fue posible guardar el cliente.'))
    });
  }

  solicitarCambioEstado(cliente: any) {
    this.clientePorCambiar = cliente;
  }

  cancelarCambioEstado() {
    if (!this.procesandoId) this.clientePorCambiar = null;
  }

  confirmarCambioEstado() {
    const cliente = this.clientePorCambiar;
    if (!cliente || this.procesandoId) return;
    this.procesandoId = cliente.membresiaId;
    this.clientesService.cambiarEstado(cliente.membresiaId, !cliente.activo, this.esSuperadmin ? cliente.negocioId : undefined).pipe(finalize(() => {
      this.procesandoId = null;
      this.cdr.detectChanges();
    })).subscribe({
      next: (resultado: any) => {
        this.clientePorCambiar = null;
        this.cargarClientes();
        this.toast.success(resultado.mensaje || 'Estado actualizado correctamente.');
      },
      error: err => this.toast.error(obtenerMensajeHttp(err, 'No fue posible cambiar el estado del cliente.'))
    });
  }

  cerrarSesion() {
    this.authService.logout();
    window.location.href = '/admin/login';
  }

  private formularioVacio() {
    return {
      nombre: '',
      cedula: '',
      email: '',
      negocioId: this.negocioSeleccionado || '',
      cuentaActivada: true,
      password: this.crearPassword()
    };
  }

  generarPassword() {
    this.formulario.password = this.crearPassword();
  }

  private crearPassword(): string {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const valores = crypto.getRandomValues(new Uint32Array(12));
    return Array.from(valores, valor => caracteres[valor % caracteres.length]).join('');
  }
}
