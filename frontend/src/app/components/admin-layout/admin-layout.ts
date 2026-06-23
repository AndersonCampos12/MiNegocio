import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-white/95">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex items-center justify-between">
          
          <!-- Logo / Marca -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span class="text-lg font-bold text-gray-800 hidden sm:block">Mi Negocio</span>
            </div>

            <!-- 🟢 NUEVO: Botón para ir a la Tienda -->
            <a routerLink="/tienda"
               class="hidden sm:flex items-center gap-1.5 ml-4 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all active:scale-95">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Ver Tienda
            </a>
          </div>

          <!-- Perfil de usuario -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-3">
              <!-- Avatar mejorado -->
              <div class="relative">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-blue-100">
                  {{ (usuario?.nombre || usuario?.email || 'A')[0] | uppercase }}
                </div>
                <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              
              <div class="hidden sm:block">
                <p class="text-sm font-semibold text-gray-800 leading-tight">
                  {{ usuario?.nombre || usuario?.email || 'Usuario' }}
                </p>
                <span class="inline-flex items-center gap-1 mt-0.5 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                  </svg>
                  {{ rol }}
                </span>
              </div>
            </div>

            <!-- Botón cerrar sesión mejorado -->
            <button (click)="onCerrarSesion.emit()"
              class="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-2 rounded-lg transition-all active:scale-95 group">
              <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span class="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        <!-- 🟢 NUEVO: Botón móvil para ir a la Tienda (visible solo en pantallas pequeñas) -->
        <div class="sm:hidden mt-2 pt-2 border-t border-gray-100">
          <a routerLink="/tienda"
             class="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all active:scale-95">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Ver Tienda
          </a>
        </div>
      </div>
    </header>
  `
})
export class AdminLayout {
  @Input() usuario: any = null;
  @Input() rol: string | null = null;
  @Output() onCerrarSesion = new EventEmitter<void>();
}