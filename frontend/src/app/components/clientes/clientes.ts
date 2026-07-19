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

  constructor(
    private authService: AuthService,
    private clientesService: ClientesService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.rolActual = this.authService.getRole();
    this.usuarioActual = this.authService.getSocioActual();
    this.cargarClientes();
  }

  get clientesFiltrados() {
    const texto = this.filtroTexto.trim().toLowerCase();
    return this.clientes.filter(cliente => !texto || [cliente.nombre, cliente.cedula, cliente.email]
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
    this.clientesService.obtenerClientes(this.estadoSeleccionado).subscribe({
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
      ? { nombre: cliente.nombre, cedula: cliente.cedula || '', email: cliente.email }
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

    if (nombre.length < 2 || nombre.length > 100) return this.toast.warning('El nombre debe tener entre 2 y 100 caracteres.');
    if (!this.clienteEditando && !/^\d{10}(\d{3})?$/.test(cedula)) return this.toast.warning('Ingresa una cédula de 10 dígitos o un RUC de 13 dígitos.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.toast.warning('Ingresa un correo electrónico válido.');

    this.guardando = true;
    const peticion = this.clienteEditando
      ? this.clientesService.actualizarCliente(this.clienteEditando.membresiaId, { nombre, email })
      : this.clientesService.crearCliente({ nombre, cedula, email });

    peticion.pipe(finalize(() => {
      this.guardando = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (resultado: any) => {
        this.cerrarModal();
        this.cargarClientes();
        this.toast.success(resultado.mensaje || (this.clienteEditando ? 'Cliente actualizado correctamente.' : 'Cliente registrado correctamente.'));
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
    this.clientesService.cambiarEstado(cliente.membresiaId, !cliente.activo).pipe(finalize(() => {
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
    return { nombre: '', cedula: '', email: '' };
  }
}
