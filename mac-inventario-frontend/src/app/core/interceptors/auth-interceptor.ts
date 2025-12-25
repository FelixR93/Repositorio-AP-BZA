import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth';

const API_BASE_URL = 'http://localhost:4000/api';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // SSR: no localStorage
  if (!isPlatformBrowser(platformId)) return next(req);

  // Solo tu API
  if (!req.url.startsWith(API_BASE_URL)) return next(req);

  // ✅ lee token desde TU AuthService (misma key bonanza_token)
  const auth = inject(AuthService);
  const token = auth.getToken();

  // Login/health sin token
  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
