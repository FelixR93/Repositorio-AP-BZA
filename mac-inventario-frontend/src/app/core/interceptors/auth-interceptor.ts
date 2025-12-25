import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const TOKEN_KEY = 'bonanza_token';
const API_BASE_URL = 'http://localhost:4000/api';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // Solo aplica a tu API
  const isApi = req.url.startsWith(API_BASE_URL);
  if (!isApi) return next(req);

  // No meter token en login
  if (req.url.includes('/auth/login')) return next(req);

  // En servidor no hay localStorage
  if (!isBrowser) return next(req);

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
