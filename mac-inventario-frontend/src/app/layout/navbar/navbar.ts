import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { APS } from '../../core/constants/aps.const';
import { User } from '../../core/models/user.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  aps = APS;

  user: User | null = null;

  // UI
  openAps = false;
  apQuery = '';

  constructor(private auth: AuthService, private router: Router) {
    this.user = this.auth.getUser();
    this.auth.user$.subscribe((u) => (this.user = u));
  }

  // ✅ Label seguro (no depende de fullName/email/name)
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

  get filteredAps(): readonly string[] {
    const q = this.apQuery.trim().toLowerCase();
    if (!q) return this.aps; // ✅ ok: readonly -> readonly
    return this.aps.filter((a) => a.toLowerCase().includes(q)); // filter devuelve string[] (mutable) pero TS lo acepta como readonly
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

    // si el click NO fue dentro del dropdown, se cierra
    if (!target.closest('.aps-dd')) this.closeAps();
  }

  private toSlug(ap: string): string {
    return ap
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
}
