import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth'; // Ajusta la ruta si es necesario
import { AdminLayout } from '../admin-layout/admin-layout';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminLayout],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'] // Si tienes estilos extra, aunque usaremos Tailwind
})
export class Dashboard implements OnInit {
  usuarioActual: any = null;
  rolActual: string | null = null;
  nombreEmpresaActual: string = 'Cargando...'; // <-- Nueva propiedad

  // Menú dinámico
  menuItems = [
    // La CAJA es vital para VENDEDORES y CAJEROS
    { titulo: 'Caja', ruta: '/admin/caja', icono: 'caja', roles: ['SUPERADMIN', 'ADMINISTRADOR', 'VENDEDOR', 'CAJERO'] },

    // El INVENTARIO: Vendedores pueden ver (para consultas), Cajeros y Admin también
    { titulo: 'Inventario', ruta: '/admin/inventario', icono: 'inventario', roles: ['SUPERADMIN', 'ADMINISTRADOR', 'VENDEDOR', 'CAJERO'] },

    // USUARIOS: Solo admins
    { titulo: 'Usuarios', ruta: '/admin/usuarios', icono: 'usuarios', roles: ['SUPERADMIN', 'ADMINISTRADOR'] },

    // EMPRESAS: Solo superadmin
    { titulo: 'Negocios', ruta: '/admin/negocios', icono: 'negocios', roles: ['SUPERADMIN', 'ADMINISTRADOR'] },

    // REPORTES: Admin y Superadmin
    { titulo: 'Reportes', ruta: '/admin/reportes', icono: 'reportes', roles: ['SUPERADMIN', 'ADMINISTRADOR'] },
  ];

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.rolActual = this.authService.getRole();
    const usuarioStr = localStorage.getItem('usuario');

    if (usuarioStr) {
      this.usuarioActual = JSON.parse(usuarioStr);

      // Lógica para mostrar la empresa
      if (this.rolActual === 'SUPERADMIN') {
        this.nombreEmpresaActual = 'Modo Global (Superadmin)';
      } else {
        // Asumiendo que guardaste el nombre del negocio en el login
        this.nombreEmpresaActual = this.usuarioActual.negocio?.nombre || 'Mi Empresa';
      }
    }
  }

  // Filtra los ítems del menú según el rol
  get menuPermitido() {
    const rol = this.authService.getRole();
    // El filtro debe comparar exactamente el rol contra el array roles del objeto
    return this.menuItems.filter(item => item.roles.includes(rol || ''));
  }

  cerrarSesion(): void {
    this.authService.logout();
    window.location.href = '/admin/login';
  }
}