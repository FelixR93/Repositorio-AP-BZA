import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth';
import { LoadingService } from '../../core/services/loading';
// Si quieres navbar público (solo en login):
// import { Navbar } from '../../layout/navbar/navbar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule /*, Navbar */],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit, OnDestroy {
  // credenciales
  username = '';
  password = '';
  showPass = false;

  // UI
  error = '';
  year = new Date().getFullYear();

  // HUD login loader (solo login)
  loading = false;
  hudText = 'Inicializando autenticación…';
  hudProgress = 15;

  // Logo
  logoSrc = '/bonanza.png';

  // Efecto 3D
  tiltX = 0;
  tiltY = 0;
  glowX = 50;
  glowY = 50;
  px = '50%';
  py = '50%';

  private sub = new Subscription();

  constructor(
    private auth: AuthService,
    private router: Router,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    // Si ya hay token, manda al dashboard (opcional)
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/');
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  togglePass() {
    this.showPass = !this.showPass;
  }

  onLogoError() {
    // fallback (por si falla la ruta del logo)
    this.logoSrc = '/assets/bonanza.png';
  }

  onMove(ev: MouseEvent, card: HTMLElement) {
    const rect = card.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    this.px = `${px}%`;
    this.py = `${py}%`;

    const rx = ((py - 50) / 50) * -6; // -6..6 aprox
    const ry = ((px - 50) / 50) * 8;  // -8..8 aprox

    this.tiltX = rx;
    this.tiltY = ry;

    this.glowX = px;
    this.glowY = py;
  }

  onLeave() {
    this.tiltX = 0;
    this.tiltY = 0;
    this.glowX = 50;
    this.glowY = 50;
    this.px = '50%';
    this.py = '50%';
  }

  onSubmit() {
    if (this.loading) return;

    this.error = '';
    this.loading = true;

    // si quieres también prender el loader global:
    // this.loadingService.show();

    this.hudText = 'Validando credenciales…';
    this.hudProgress = 35;

    const s = this.auth
      .login(this.username, this.password)
      .pipe(
        finalize(() => {
          this.loading = false;
          // this.loadingService.hide();
        })
      )
      .subscribe({
        next: () => {
          this.hudText = 'Cargando perfil y permisos…';
          this.hudProgress = 80;

          // pequeño “feel” visual (opcional)
          setTimeout(() => {
            this.hudText = 'Acceso concedido. Redirigiendo…';
            this.hudProgress = 100;
            this.router.navigateByUrl('/');
          }, 250);
        },
        error: (err) => {
          this.hudText = 'Acceso denegado.';
          this.hudProgress = 15;
          this.error = err?.error?.message || 'Credenciales inválidas.';
        },
      });

    this.sub.add(s);
  }
}
