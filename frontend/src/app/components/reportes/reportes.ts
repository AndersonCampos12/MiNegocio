import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReporteService } from '../../services/reporte';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminLayout],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {
  metricas: any = {
    ingresosTotales: 0,
    totalVentas: 0,
    alertasStock: 0,
    ultimasVentas: [],
    topProductos: [] // <-- NUEVO: Para "productos que salen"
  };
  cargando = true;
  usuarioActual: any = null;
  rolActual: string | null = null;

  mostrarVisor = false;
  urlFacturaSegura: SafeResourceUrl | null = null;

  constructor(
    private reporteService: ReporteService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarMetricas();
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

  cargarMetricas() {
    this.cargando = true;
    this.reporteService.obtenerMetricas().subscribe({
      next: (data) => {
        this.metricas = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando reportes:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularAlturaBarra(valor: number, maximo: number): number {
    if (maximo === 0) return 0;
    return (valor / maximo) * 100;
  }

  maxTotalVentas(): number {
    if (!this.metricas.ultimasVentas || this.metricas.ultimasVentas.length === 0) {
      return 1;
    }
    return Math.max(...this.metricas.ultimasVentas.map((v: any) => v.total));
  }

  imprimirFactura(ventaId: string) {
    const urlFactura = `http://localhost:3000/api/reportes/factura/${ventaId}`;
    this.urlFacturaSegura = this.sanitizer.bypassSecurityTrustResourceUrl(urlFactura);
    this.mostrarVisor = true;
    this.cdr.detectChanges();
  }

  cerrarVisor() {
    this.mostrarVisor = false;
    this.urlFacturaSegura = null;
  }
}