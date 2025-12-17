import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  username = '';
  password = '';
  error = '';
  loading = false;
  year = new Date().getFullYear();

  showPass = false;
  logoSrc = '/bonanza-logo.png';

  // Loader HUD
  hudText = 'Inicializando sistema…';
  hudProgress = 0;

  // 3D
  private isBrowser = false;
  tiltX = 0;
  tiltY = 0;
  px = 0;
  py = 0;
  glowX = 50;
  glowY = 35;

  constructor(
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  onSubmit() {
    if (this.loading) return;

    this.error = '';
    this.loading = true;
    this.startHud();

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => {
        this.hudText = 'Acceso concedido';
        this.hudProgress = 100;
        setTimeout(() => this.router.navigateByUrl('/'), 600);
      },
      error: (err) => {
        this.loading = false;
        this.hudProgress = 0;
        this.error = err?.error?.message || 'Credenciales inválidas.';
      }
    });
  }

  startHud() {
    this.hudText = 'Validando credenciales…';
    this.hudProgress = 10;

    setTimeout(() => {
      if (!this.loading) return;
      this.hudText = 'Verificando permisos…';
      this.hudProgress = 45;
    }, 500);

    setTimeout(() => {
      if (!this.loading) return;
      this.hudText = 'Conectando con el servidor…';
      this.hudProgress = 75;
    }, 900);
  }

  togglePass() {
    this.showPass = !this.showPass;
  }

  onLogoError() {
    this.logoSrc = '/bonanza-logo.png';
  }

  onMove(ev: MouseEvent, card: HTMLElement) {
    if (!this.isBrowser) return;

    const r = card.getBoundingClientRect();
    const px01 = (ev.clientX - r.left) / r.width;
    const py01 = (ev.clientY - r.top) / r.height;

    this.px = (px01 - 0.5) * 2;
    this.py = (py01 - 0.5) * 2;

    this.tiltY = this.px * 18;
    this.tiltX = -this.py * 14;

    this.glowX = px01 * 100;
    this.glowY = py01 * 100;
  }

  onLeave() {
    this.tiltX = 0;
    this.tiltY = 0;
    this.px = 0;
    this.py = 0;
    this.glowX = 50;
    this.glowY = 35;
  }
}
