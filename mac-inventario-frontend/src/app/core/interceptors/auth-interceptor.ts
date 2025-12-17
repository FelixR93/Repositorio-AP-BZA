import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  // ✅ En SSR no adjuntar token
  if (!isPlatformBrowser(platformId)) return next(req);

  const token = auth.getToken();

  // No adjuntar token a login (opcional)
  if (!token || req.url.includes('/api/auth/login')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });

  return next(authReq);
};
