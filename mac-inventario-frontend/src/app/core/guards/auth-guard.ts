import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../services/auth';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // ✅ En SSR no redirigimos ni usamos storage; dejamos pasar render inicial
  if (!isPlatformBrowser(platformId)) return true;

  if (auth.isLoggedIn()) return true;

  router.navigateByUrl('/login');
  return false;
};
