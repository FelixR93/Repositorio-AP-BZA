import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth';

function isPublic(url: string) {
  return url.includes('/api/auth/login') || url.includes('/api/auth/register');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  // ✅ SSR: sin token
  if (!isPlatformBrowser(platformId)) return next(req);

  // ✅ rutas públicas: sin token
  if (isPublic(req.url)) return next(req);

  const token = auth.getToken();
  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
  );
};
