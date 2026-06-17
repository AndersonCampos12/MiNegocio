import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

declare const google: any; // Declaramos la variable global del script de Google

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  email = '';
  password = '';
  errorMsg = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    // Inicialización del Servicio de Identidad de Google OAuth 2.0 (2.3.1)
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: 'tu-google-client-id.apps.googleusercontent.com', // Credencial de Google Cloud
        callback: (response: any) => this.manejarLoginGoogle(response.credential)
      });

      // Renderiza el botón nativo de Google sobre el contenedor del HTML
      google.accounts.id.renderButton(
        document.getElementById('googleBtn'),
        { theme: 'outline', size: 'large', text: 'signin_with' }
      );
    }
  }

  ejecutarLogin() {
    this.authService.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => this.errorMsg = err.error?.mensaje || 'Credenciales inválidas'
    });
  }

  manejarLoginGoogle(tokenGoogle: string) {
    // Envía el token al backend para validación cruzada y emisión de JWT propio (2.3.2)
    this.authService.loginGoogle(tokenGoogle).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => this.errorMsg = 'Error en validación OAuth con Google'
    });
  }
}