import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReporteService } from '../../services/reporte';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css' // Opcional
})
export class Reportes implements OnInit {
  // Inicializamos en cero para que la pantalla no parpadee
  metricas: any = {
    ingresosTotales: 0,
    totalVentas: 0,
    alertasStock: 0,
    ultimasVentas: []
  };
  cargando = true;

  constructor(
    private reporteService: ReporteService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.reporteService.obtenerMetricas().subscribe({
      next: (data) => {
        this.metricas = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando reportes:', err);
        this.cargando = false;
      }
    });
  }
}