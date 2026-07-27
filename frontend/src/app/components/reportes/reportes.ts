import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReporteService } from '../../services/reporte';
import { AdminLayout } from '../admin-layout/admin-layout';
import { AuthService } from '../../services/auth';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastService } from '../../services/toast';
import { obtenerMensajeHttp } from '../../utils/http-error';

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
  ventaSeleccionadaId: string | null = null;
  descargandoFactura = false;
  recomendaciones: any[] = [];
  mensajeRecomendaciones = '';
  fuenteRecomendaciones = '';
  cargandoRecomendaciones = false;

  constructor(
    private reporteService: ReporteService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private toast: ToastService
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
        this.toast.error(obtenerMensajeHttp(err, 'No se pudieron cargar los reportes.'));
        this.cdr.detectChanges();
      }
    });
  }

  generarRecomendaciones() {
    if (this.cargandoRecomendaciones) return;
    this.cargandoRecomendaciones = true;

    this.reporteService.obtenerRecomendaciones().subscribe({
      next: (data) => {
        this.recomendaciones = data.recomendaciones || [];
        this.mensajeRecomendaciones = data.mensaje || '';
        this.fuenteRecomendaciones = data.fuente || '';
        this.cargandoRecomendaciones = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error generando recomendaciones:', err);
        this.cargandoRecomendaciones = false;
        this.toast.error('No se pudieron generar las recomendaciones');
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
    const urlFactura = `http://localhost:3000/api/reportes/factura/${ventaId}?autoImprimir=false&estilo=moderno`;
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
    });
  }

  cerrarVisor() {
    this.mostrarVisor = false;
    this.urlFacturaSegura = null;
    this.ventaSeleccionadaId = null;
  }
}
