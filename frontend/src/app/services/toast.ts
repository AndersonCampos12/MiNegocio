import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: number;
    mensaje: string;
    tipo: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    toasts$ = this.toastsSubject.asObservable();

    private agregarToast(mensaje: string, tipo: 'success' | 'error' | 'info' | 'warning') {
        const id = Date.now();
        const listaActual = this.toastsSubject.value;

        this.toastsSubject.next([...listaActual, { id, mensaje, tipo }]);

        // Desvanecer automáticamente después de 4 segundos
        setTimeout(() => {
            this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
        }, 4000);
    }

    success(msg: string) { this.agregarToast(msg, 'success'); }
    error(msg: string) { this.agregarToast(msg, 'error'); }
    info(msg: string) { this.agregarToast(msg, 'info'); }
    warning(msg: string) { this.agregarToast(msg, 'warning'); }

    remover(id: number) {
        this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
    }
}