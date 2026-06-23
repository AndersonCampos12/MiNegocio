import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-20 right-6 z-[99999] flex flex-col gap-3 w-full max-w-sm px-4 sm:px-0">
      
      @for (toast of (toastService.toasts$ | async); track toast.id) {
        <div [ngClass]="{
          'border-green-500 shadow-green-500/10': toast.tipo === 'success',
          'border-red-500 shadow-red-500/10': toast.tipo === 'error',
          'border-blue-600 bg-gradient-to-r from-blue-600 to-blue-700 text-white': toast.tipo === 'info',
          'border-amber-500 shadow-amber-500/10': toast.tipo === 'warning'
        }" class="bg-white text-gray-800 p-4 rounded-xl border-l-4 border shadow-2xl flex items-start justify-between gap-3 animate-slide-in">
          
          <div class="flex gap-2.5 items-center">
            @if (toast.tipo === 'success') { <span class="text-lg">🟢</span> }
            @if (toast.tipo === 'error') { <span class="text-lg">🔴</span> }
            @if (toast.tipo === 'info') { <span class="text-lg text-white">⚡</span> }
            @if (toast.tipo === 'warning') { <span class="text-lg">⚠️</span> }
            
            <p class="text-sm font-semibold m-0 leading-snug">{{ toast.mensaje }}</p>
          </div>

          <button (click)="cerrar(toast.id)" [className]="toast.tipo === 'info' ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-gray-600'" class="transition-colors p-0.5 rounded-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class ToastContainer {
  constructor(public toastService: ToastService) { }

  cerrar(id: number) {
    this.toastService.remover(id);
  }
}