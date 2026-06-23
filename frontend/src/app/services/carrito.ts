import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CarritoService {
    private storageKey = 'carrito_tienda';

    obtenerCarrito(): any[] {
        const carrito = localStorage.getItem(this.storageKey);
        return carrito ? JSON.parse(carrito) : [];
    }

    agregarProducto(producto: any) {
        const carrito = this.obtenerCarrito();
        const existente = carrito.find((item: any) => item.id === producto.id);

        if (existente) {
            existente.cantidad += 1;
        } else {
            carrito.push({ ...producto, cantidad: 1 });
        }

        localStorage.setItem(this.storageKey, JSON.stringify(carrito));
        return carrito;
    }

    eliminarProducto(productoId: string) {
        let carrito = this.obtenerCarrito();
        carrito = carrito.filter((item: any) => item.id !== productoId);
        localStorage.setItem(this.storageKey, JSON.stringify(carrito));
        return carrito;
    }

    actualizarCantidad(productoId: string, cantidad: number) {
        const carrito = this.obtenerCarrito();
        const producto = carrito.find((item: any) => item.id === productoId);
        if (producto) {
            producto.cantidad = cantidad;
            if (cantidad <= 0) {
                return this.eliminarProducto(productoId);
            }
        }
        localStorage.setItem(this.storageKey, JSON.stringify(carrito));
        return carrito;
    }

    obtenerTotal(): number {
        return this.obtenerCarrito().reduce((total: number, item: any) => {
            return total + (item.valor * item.cantidad);
        }, 0);
    }

    contarItems(): number {
        return this.obtenerCarrito().reduce((total: number, item: any) => {
            return total + item.cantidad;
        }, 0);
    }

    vaciarCarrito() {
        localStorage.removeItem(this.storageKey);
    }
}