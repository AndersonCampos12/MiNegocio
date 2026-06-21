import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  standalone: true,
  templateUrl: './splash.html',
  styleUrl: './splash.css',
})
export class Splash implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    // Simulamos un tiempo de carga de 2.5 segundos
    setTimeout(() => {
      this.verificarSesion();
    }, 2500);
  }

  private verificarSesion() {
    // Si usas localStorage para guardar el JWT, lo verificamos aquí
    const token = localStorage.getItem('token');

    if (token) {
      // Opcional: Podrías decodificar el token para ver el rol y decidir la ruta
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}