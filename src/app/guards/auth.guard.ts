import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const storageService = inject(StorageService);
  const router = inject(Router);

  if (storageService.getEmployeeId()) {
    return true;
  }

  // Redirect to login page and keep the original URL as returnUrl query parameter
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
