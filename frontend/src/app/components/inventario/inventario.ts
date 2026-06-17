import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Agregado ChangeDetectorRef
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class Inventario implements OnInit {
  productos: any[] = [];

  // 2. Inyectamos cdr
  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.productoService.obtenerProductos().subscribe({
      next: (data: any) => {
        console.log('📦 MIS PRODUCTOS DESDE EL BACKEND:', data);
        this.productos = data;
        this.cdr.detectChanges(); // 3. Forzamos el renderizado de la pantalla
      },
      error: (err: any) => console.error(err)
    });
  }
}