import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pointer-events-none fixed inset-x-4 top-5 z-[99999] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-[390px]"
      aria-live="polite" aria-atomic="true">
      @for (toast of (toastService.toasts$ | async); track toast.id) {
        <div role="status"
          class="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_16px_45px_-12px_rgba(15,23,42,0.28)] backdrop-blur animate-toast-in">
          <div class="flex items-start gap-3.5 p-4 pr-3">
            <div [ngClass]="{
                'bg-emerald-50 text-emerald-600 ring-emerald-100': toast.tipo === 'success',
                'bg-red-50 text-red-600 ring-red-100': toast.tipo === 'error',
                'bg-blue-50 text-blue-600 ring-blue-100': toast.tipo === 'info',
                'bg-amber-50 text-amber-600 ring-amber-100': toast.tipo === 'warning'
              }" class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1">
              @if (toast.tipo === 'success') {
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="m5 12 4 4L19 6"/></svg>
              } @else if (toast.tipo === 'error') {
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18 18 6M6 6l12 12"/></svg>
              } @else if (toast.tipo === 'warning') {
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.3 4.5 2.8 17.5A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z"/></svg>
              } @else {
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              }
            </div>

            <div class="min-w-0 flex-1">
              <p class="m-0 text-sm font-semibold text-gray-900">{{ titulo(toast.tipo) }}</p>
              <p class="m-0 mt-0.5 break-words text-sm leading-5 text-gray-600">{{ toast.mensaje }}</p>
            </div>

            <button type="button" (click)="cerrar(toast.id)" aria-label="Cerrar notificación"
              class="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div [ngClass]="{
              'bg-emerald-500': toast.tipo === 'success',
              'bg-red-500': toast.tipo === 'error',
              'bg-blue-500': toast.tipo === 'info',
              'bg-amber-500': toast.tipo === 'warning'
            }" class="toast-progress absolute bottom-0 left-0 h-1 w-full origin-left"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes toastIn {
      from { transform: translate3d(24px, -6px, 0) scale(.98); opacity: 0; }
      to { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
    }
    @keyframes toastProgress {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
    .animate-toast-in {
      animation: toastIn .3s cubic-bezier(.16, 1, .3, 1) both;
    }
    .toast-progress {
      animation: toastProgress 4s linear forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .animate-toast-in, .toast-progress { animation: none; }
    }
  `]
})
export class ToastContainer {
  constructor(public toastService: ToastService) { }

  cerrar(id: number) {
    this.toastService.remover(id);
  }

  titulo(tipo: 'success' | 'error' | 'info' | 'warning') {
    return {
      success: 'Operación exitosa',
      error: 'No se pudo completar',
      info: 'Información',
      warning: 'Atención'
    }[tipo];
  }
}
