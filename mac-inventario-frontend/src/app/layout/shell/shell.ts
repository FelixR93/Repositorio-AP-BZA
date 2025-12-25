import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth';
import { APS } from '../../core/constants/aps.const';
import { User } from '../../core/models/user.model';
import { LoadingService } from '../../core/services/loading';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnDestroy {
  aps = APS;

  user: User | null = null;

  // UI
  sidebarOpen = false;
  apOpen = false;

  year = new Date().getFullYear();

  private sub = new Subscription();

  constructor(
    private auth: AuthService,
    public router: Router,
    public loading: LoadingService
  ) {
    // usuario inicial (desde BehaviorSubject)
    this.user = this.auth.getUser();

    // suscripción a cambios de usuario
    this.sub.add(this.auth.user$.subscribe((u) => (this.user = u)));

    // ✅ UN SOLO listener para navegación:
    // - cierra sidebar/ap dropdown
    // - resetea loader si la navegación termina/cancela/falla
    this.sub.add(
      this.router.events
        .pipe(
          filter(
            (e) =>
              e instanceof NavigationEnd ||
              e instanceof NavigationCancel ||
              e instanceof NavigationError
          )
        )
        .subscribe(() => {
          // cerrar UI
          this.apOpen = false;
          if (this.sidebarOpen) this.closeSidebar();

          // anti “cargando pegado”
          this.loading.reset();
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // -----------------------------
  // computed
  // -----------------------------
  get isAdmin(): boolean {
    return (this.user as any)?.role === 'ADMIN';
  }

  get userLabel(): string {
    const u: any = this.user;
    return u?.fullName || u?.username || u?.nombre || u?.userName || 'Sesión activa';
  }

  get roleLabel(): string {
    return (this.user as any)?.role || '—';
  }

  // -----------------------------
  // UI actions
  // -----------------------------
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    if (!this.sidebarOpen) this.apOpen = false;
  }

  closeSidebar() {
    this.sidebarOpen = false;
    this.apOpen = false;
  }

  toggleAp() {
    this.apOpen = !this.apOpen;
  }

  logout() {
    this.closeSidebar();
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeSidebar();
  }

  // -----------------------------
  // helpers
  // -----------------------------
  isApActive(ap: string): boolean {
    const slug = this.toSlug(ap);
    const url = this.router.url || '';
    return url.startsWith(`/inventory/${slug}`);
  }

  toSlug(ap: string): string {
    return String(ap || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
}
