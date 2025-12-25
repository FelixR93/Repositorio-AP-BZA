import { Routes } from '@angular/router';

import { Shell } from './layout/shell/shell';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Forbidden } from './pages/forbidden/forbidden';
import { NotFound } from './pages/not-found/not-found';

import { Users } from './pages/admin/users/users';

import { ApTabs } from './pages/inventory/ap-tabs/ap-tabs';
import { DevicesList } from './pages/inventory/devices-list/devices-list';
import { DevicesForm } from './pages/inventory/devices-form/devices-form';
import { DevicesImport } from './pages/inventory/devices-import/devices-import';

import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  // Login fuera del Shell
  { path: 'login', component: Login },

  // App protegida dentro del Shell (Navbar + Footer)
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', component: Dashboard },

      // Inventory home = selector de APs + acceso a Global
      { path: 'inventory', component: ApTabs },

      // Global (todos los APs)
      { path: 'inventory/global', component: DevicesList, data: { mode: 'GLOBAL' } },

      // AP específico
      { path: 'inventory/:ap', component: DevicesList, data: { mode: 'AP' } },

      // NUEVO (sin id)
      { path: 'inventory/:ap/new', component: DevicesForm },

      // IMPORT
      { path: 'inventory/:ap/import', component: DevicesImport },

      // EDIT (con id + /edit)
      { path: 'inventory/:ap/:id/edit', component: DevicesForm },

      // Admin
      {
        path: 'admin/users',
        component: Users,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },

      { path: 'forbidden', component: Forbidden },
      { path: '**', component: NotFound },
    ],
  },
];
