import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, timeout } from 'rxjs/operators';
import { LoadingService } from '../services/loading';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  loading.show();

  return next(req).pipe(
    timeout(20000),            // ⬅️ evita “pending infinito” (ajusta si quieres)
    finalize(() => loading.hide())
  );
};
