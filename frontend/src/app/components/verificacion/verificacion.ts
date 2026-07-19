import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-verificacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verificacion.html',
  styleUrl: './verificacion.css'
})
export class Verificacion implements OnInit {
  email = '';
  codigo = '';
  slug = '';
  mensaje = '';
  errorMsg = '';
  validando = false;
  reenviando = false;
  verificado = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.email = String(this.route.snapshot.queryParamMap.get('email') || '').trim().toLowerCase();
    this.slug = String(this.route.snapshot.queryParamMap.get('slug') || '');
  }

  verificar() {
    this.errorMsg = '';
    this.mensaje = '';
    if (!this.email || !/^\d{6}$/.test(this.codigo.trim())) {
      this.errorMsg = 'Ingresa el correo y el código de 6 dígitos.';
      return;
    }

    this.validando = true;
    this.authService.verificarCuenta(this.email, this.codigo.trim()).pipe(finalize(() => {
      this.validando = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (respuesta: any) => {
        this.verificado = true;
        this.mensaje = respuesta.mensaje || 'Cuenta verificada correctamente.';
      },
      error: err => this.errorMsg = err.error?.mensaje || 'No fue posible verificar la cuenta.'
    });
  }

  reenviar() {
    if (!this.email || this.reenviando) {
      if (!this.email) this.errorMsg = 'Ingresa el correo asociado a la cuenta.';
      return;
    }
    this.errorMsg = '';
    this.reenviando = true;
    this.authService.reenviarCodigo(this.email).pipe(finalize(() => {
      this.reenviando = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (respuesta: any) => this.mensaje = respuesta.mensaje || 'Código reenviado.',
      error: err => this.errorMsg = err.error?.mensaje || 'No fue posible reenviar el código.'
    });
  }

  irAlLogin() {
    const ruta = this.slug ? ['/tienda', this.slug, 'login'] : ['/login'];
    this.router.navigate(ruta);
  }
}
