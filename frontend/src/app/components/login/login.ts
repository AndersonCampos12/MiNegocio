import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

declare const google: any;

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
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef // Agregamos esto para forzar el refresco visual si es necesario
  ) { }

  ngOnInit() {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this.manejarLoginGoogle(response.credential)
      });

      google.accounts.id.renderButton(
        document.getElementById('googleBtn'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '320'
        }
      );
    }
  }

  ejecutarLogin() {
    if (!this.email || !this.password) {
      this.errorMsg = 'Por favor, ingresa tu correo y contraseña.';
      return;
    }

    this.isLoading = true;
    this.errorMsg = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (res: any) => {
        // Envolvemos el next en NgZone para asegurar que la UI reaccione
        this.ngZone.run(() => {
          // Validamos que realmente haya un token (a veces los interceptores tragan errores)
          if (res && res.token) {
            this.procesarRedireccion(res);
          } else {
            this.detenerCarga('Error inesperado al recibir los datos.');
          }
        });
      },
      error: (err) => {
        // Obligamos a Angular a mostrar el error y quitar el spinner
        this.ngZone.run(() => {
          this.detenerCarga(err.error?.mensaje || 'Credenciales incorrectas. Inténtalo de nuevo.');
        });
      }
    });
  }

  manejarLoginGoogle(tokenGoogle: string) {
    this.isLoading = true;
    this.errorMsg = '';

    this.authService.loginGoogle(tokenGoogle).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          if (res && res.token) {
            this.procesarRedireccion(res);
          } else {
            this.detenerCarga('Error al procesar los datos de Google.');
          }
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.detenerCarga(err.error?.mensaje || 'Error en validación con Google');
        });
      }
    });
  }

  // Método auxiliar para detener el spinner y mostrar error asegurando el refresco visual
  private detenerCarga(mensaje: string) {
    this.isLoading = false;
    this.errorMsg = mensaje;
    this.cdr.detectChanges(); // Esto le da un "empujón" a Angular para que actualice el HTML sí o sí
  }

  // NUEVA LÓGICA DE RUTAS: Seguridad por defecto (Lowest Privilege)
  // NUEVA LÓGICA DE RUTAS
  private procesarRedireccion(response: any) {

    this.isLoading = false;

    const rolUsuario =
      response?.usuario?.rol ||
      response?.socio?.rol ||
      'CLIENTE';


    switch (rolUsuario) {
      case 'SUPERADMIN':
      case 'ADMINISTRADOR':
      case 'VENDEDOR':
      case 'CAJERO':
        this.router.navigate(['/admin']);
        break;

      case 'CLIENTE':
        this.router.navigate(['/tienda']);
        break;

      default:
        this.router.navigate(['/login']);
        break;
    }
  }
}