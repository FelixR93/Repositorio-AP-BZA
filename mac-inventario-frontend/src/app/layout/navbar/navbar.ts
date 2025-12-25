import { Component, HostListener, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth';
import { APS } from '../../core/constants/aps.const';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnDestroy {
  // ✅ fuerza readonly para evitar problemas TS
  aps: readonly string[] = APS;

  user: User | null = null;

  // UI
  openAps = false;
  apQuery = '';

  private sub = new Subscription();

  constructor(private auth: AuthService, private router: Router) {
    this.user = this.auth.getUser();

    // ✅ evita memory leak
    this.sub.add(this.auth.user$.subscribe((u) => (this.user = u)));

    // ✅ al navegar: cierra dropdown
    this.sub.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => this.closeAps())
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // Labels seguros
  get userLabel(): string {
    const u: any = this.user;
    return u?.fullName || u?.username || u?.nombre || u?.userName || 'Sesión activa';
  }

  get roleLabel(): string {
    return (this.user as any)?.role || '—';
  }

  get isAdmin(): boolean {
    return (this.user as any)?.role === 'ADMIN';
  }

  // ✅ filtro sin romper readonly
  get filteredAps(): readonly string[] {
    const q = this.apQuery.trim().toLowerCase();
    if (!q) return this.aps;
    return this.aps.filter((a) => a.toLowerCase().includes(q));
  }

  toggleAps() {
    this.openAps = !this.openAps;
    if (this.openAps) this.apQuery = '';
  }

  closeAps() {
    this.openAps = false;
    this.apQuery = '';
  }

  goAp(ap: string) {
    const slug = this.toSlug(ap);
    this.closeAps();
    this.router.navigateByUrl(`/inventory/${slug}`);
  }

  logout() {
    this.closeAps();
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  // Cierra dropdown si haces click fuera
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    if (!target.closest('.aps-dd')) this.closeAps();
  }

  // ✅ ESC cierra dropdown
  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeAps();
  }

  private toSlug(ap: string): string {
    return String(ap || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
}
