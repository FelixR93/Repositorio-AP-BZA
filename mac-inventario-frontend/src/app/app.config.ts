import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

import { authInterceptor } from './core/interceptors/auth-interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ MUY recomendado en Electron (file://)
    provideRouter(routes, withHashLocation()),

    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor])),
  ],
};
