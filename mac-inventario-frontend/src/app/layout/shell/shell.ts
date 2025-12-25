import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  NavigationEnd,
} from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth';
import { APS } from '../../core/constants/aps.const';
import { User } from '../../core/models/user.model';

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
  sidebarOpen = false; // móvil
  apOpen = false;

  year = new Date().getFullYear();

  private sub = new Subscription();

  constructor(private auth: AuthService, public router: Router) {
    this.user = this.auth.getUser();
    this.sub.add(this.auth.user$.subscribe((u) => (this.user = u)));

    // ✅ cada navegación: cierra sidebar en móvil
    this.sub.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => {
          this.apOpen = false;
          // si está abierto en móvil, ciérralo al navegar
          if (this.sidebarOpen) this.closeSidebar();
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

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

  // ✅ helper para active manual (APs)
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
