import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './crear-producto.html',
  styleUrl: './crear-producto.css'
})
export class CrearProducto {
  nombre = '';
  valor: number | null = null;
  stock: number | null = null;
  descripcion = '';
  archivoSeleccionado: File | null = null;
  vistaPrevia: string | null = null;

  constructor(private productoService: ProductoService, private router: Router) { }

  // Se ejecuta cuando el usuario selecciona una foto
  alSeleccionarImagen(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      // Crear vista previa para el usuario
      const reader = new FileReader();
      reader.onload = e => this.vistaPrevia = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  guardar() {
    if (!this.nombre || !this.valor || !this.stock) {
      return alert('Llena los campos obligatorios');
    }

    const formData = new FormData();
    formData.append('nombre', this.nombre);
    formData.append('valor', this.valor.toString());
    formData.append('stock', this.stock.toString());
    formData.append('descripcion', this.descripcion);

    // Extraemos los datos del usuario logueado desde el navegador
    const usuarioString = localStorage.getItem('usuario');
    if (usuarioString) {
      const usuario = JSON.parse(usuarioString);
      // Adjuntamos el ID al paquete. (Verifica si en tu localStorage se llama 'id' o 'socioId')
      formData.append('socioId', usuario.id);
    }

    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado);
    }

    this.productoService.crearProducto(formData).subscribe({
      next: () => {
        alert('Producto creado con éxito');
        this.router.navigate(['/inventario']);
      },
      error: (err) => alert('Error al guardar: ' + err.message)
    });
  }
}