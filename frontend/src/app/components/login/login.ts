import { Component, OnInit, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

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

  constructor(private authService: AuthService, private router: Router, private ngZone: NgZone) { }

  ngOnInit() {
    // Inicialización del Servicio de Identidad de Google OAuth 2.0 (2.3.1)
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: environment.googleClientId, // Credencial de Google Cloud
        callback: (response: any) => this.manejarLoginGoogle(response.credential)
      });

      // Renderiza el botón nativo de Google sobre el contenedor del HTML
      google.accounts.id.renderButton(
        document.getElementById('googleBtn'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '400' // <-- ESTA ES LA CLAVE PARA CUBRIR TU DISEÑO
        }
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
    this.authService.loginGoogle(tokenGoogle).subscribe({
      next: () => {
        // Obligamos a Angular a procesar el cambio de ruta inmediatamente
        this.ngZone.run(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        // Envolvemos el error también para que el mensaje aparezca al instante
        this.ngZone.run(() => {
          this.errorMsg = err.error?.mensaje || 'Error en validación OAuth con Google';
        });
      }
    });
  }
}