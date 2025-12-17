import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { APS } from '../../core/constants/aps.const';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  aps = APS;

  // ✅ Se inicializa seguro (sin usar this.auth antes del constructor)
  user: User | null = null;

  constructor(private auth: AuthService, private router: Router) {
    // ✅ Ya existe this.auth, ahora sí puedes leer el usuario
    this.user = this.auth.getUser();

    // ✅ Opcional: mantener sincronizado si el user cambia (login/logout)
    this.auth.user$.subscribe(u => (this.user = u));
  }

  goAp(ap: string) {
    const slug = this.toSlug(ap);
    this.router.navigateByUrl(`/inventory/${slug}`);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  private toSlug(ap: string): string {
    return ap
      .toLowerCase()
      .replace(/\s+/g, '-')     // espacios -> guiones
      .replace(/[^\w-]/g, '');  // limpia caracteres raros
  }
}
