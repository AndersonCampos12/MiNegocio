import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  // Inyectamos las herramientas necesarias en el constructor
  constructor(private authService: AuthService, private router: Router) { }

  cerrarSesion() {
    this.authService.logout(); // Borra los tokens del localStorage
    this.router.navigate(['/login']); // Redirige inmediatamente
  }
}