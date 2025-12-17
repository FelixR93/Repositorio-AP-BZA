import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.getUser();
  const roles: string[] = route.data?.['roles'] || [];

  if (!user) {
    router.navigateByUrl('/login');
    return false;
  }

  if (roles.length && !roles.includes(user.role)) {
    router.navigateByUrl('/forbidden');
    return false;
  }

  return true;
};
