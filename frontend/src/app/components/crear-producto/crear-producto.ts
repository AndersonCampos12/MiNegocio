import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { obtenerMensajeHttp } from '../../utils/http-error';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, AdminLayout],
  templateUrl: './crear-producto.html',
  styleUrl: './crear-producto.css'
})
export class CrearProducto {
  @ViewChild('imagenInput') imagenInput?: ElementRef<HTMLInputElement>;

  readonly formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  readonly tamanoMaximoImagen = 5 * 1024 * 1024;
  nombre = '';
  valor: number | null = null;
  stock: number | null = null;
  descripcion = '';
  archivoSeleccionado: File | null = null;
  vistaPrevia: string | null = null;
  guardando = false;
  usuarioActual: any = null;
  rolActual: string | null = null;

  constructor(
    private toast: ToastService,
    private productoService: ProductoService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();
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

  alSeleccionarImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.formatosPermitidos.includes(file.type)) {
      this.limpiarImagenSeleccionada();
      this.toast.warning('Formato no permitido. Usa una imagen JPG, PNG o WEBP.');
      return;
    }
    if (file.size === 0) {
      this.limpiarImagenSeleccionada();
      this.toast.warning('La imagen seleccionada está vacía o dañada.');
      return;
    }
    if (file.size > this.tamanoMaximoImagen) {
      this.limpiarImagenSeleccionada();
      this.toast.warning('La imagen no debe superar los 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultado = reader.result as string;
      const imagen = new Image();
      imagen.onload = () => {
        this.archivoSeleccionado = file;
        this.vistaPrevia = resultado;
        this.toast.success('Imagen cargada correctamente.');
        this.cdr.detectChanges();
      };
      imagen.onerror = () => {
        this.limpiarImagenSeleccionada();
        this.toast.error('El archivo no contiene una imagen válida.');
        this.cdr.detectChanges();
      };
      imagen.src = resultado;
    };
    reader.onerror = () => {
      this.limpiarImagenSeleccionada();
      this.toast.error('No fue posible leer la imagen seleccionada.');
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removerImagen() {
    this.limpiarImagenSeleccionada();
    this.toast.info('Imagen removida.');
  }

  private limpiarImagenSeleccionada() {
    this.archivoSeleccionado = null;
    this.vistaPrevia = null;
    if (this.imagenInput) this.imagenInput.nativeElement.value = '';
    this.cdr.detectChanges();
  }

  guardar() {
    const valor = Number(this.valor);
    const stock = Number(this.stock);

    if (!this.nombre.trim()) {
      return this.toast.warning('El nombre del producto es obligatorio');
    }
    if (this.valor === null || !Number.isFinite(valor) || valor <= 0) {
      return this.toast.warning('El precio debe ser mayor a 0');
    }
    if (this.stock === null || !Number.isInteger(stock) || stock < 0) {
      return this.toast.warning('El stock debe ser un entero igual o mayor a 0');
    }
    if (this.nombre.trim().length > 120) return this.toast.warning('El nombre no puede superar los 120 caracteres');
    if (this.descripcion.trim().length > 500) return this.toast.warning('La descripción no puede superar los 500 caracteres');

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const negocioId = localStorage.getItem('negocioSeleccionado') || usuario.negocioId;
    if (!negocioId) return this.toast.error('No se pudo determinar el negocio para crear el producto.');

    const formData = new FormData();
    formData.append('nombre', this.nombre.trim());
    formData.append('valor', valor.toString());
    formData.append('stock', stock.toString());
    formData.append('descripcion', this.descripcion.trim());

    if (negocioId) {
      formData.append('negocioId', negocioId);
    }

    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado);
    }

    this.guardando = true;
    this.productoService.crearProducto(formData).pipe(finalize(() => this.guardando = false)).subscribe({
      next: () => {
        this.toast.success('Producto creado correctamente.');
        this.router.navigate(['/admin/inventario']);
      },
      error: (err) => {
        this.toast.error(obtenerMensajeHttp(err, 'No fue posible crear el producto.'));
      }
    });
  }
}
