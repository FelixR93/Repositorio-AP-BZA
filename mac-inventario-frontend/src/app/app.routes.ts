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

// ✅ NUEVO (bitácora completa)
import { Logs } from './pages/logs/logs';

import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  // -------------------------
  // Public
  // -------------------------
  { path: 'login', component: Login },

  // -------------------------
  // Protected App (Shell)
  // -------------------------
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      // Home
      { path: '', component: Dashboard, pathMatch: 'full' },

      // -------------------------
      // Inventory
      // -------------------------
      // Inventory home = selector de APs + acceso a Global
      { path: 'inventory', component: ApTabs, pathMatch: 'full' },

      // ✅ Global (todos los APs) — ANTES que inventory/:ap
      {
        path: 'inventory/global',
        component: DevicesList,
        data: { mode: 'GLOBAL' },
        pathMatch: 'full',
      },

      // ✅ RUTAS ESPECÍFICAS PRIMERO (new/import/edit)
      { path: 'inventory/:ap/new', component: DevicesForm, pathMatch: 'full' },
      { path: 'inventory/:ap/import', component: DevicesImport, pathMatch: 'full' },
      { path: 'inventory/:ap/:id/edit', component: DevicesForm, pathMatch: 'full' },

      // ✅ AP específico (listado) — AL FINAL
      {
        path: 'inventory/:ap',
        component: DevicesList,
        data: { mode: 'AP' },
        pathMatch: 'full',
      },

      // -------------------------
      // Logs (ADMIN)
      // -------------------------
      {
        path: 'logs',
        component: Logs,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },

      // -------------------------
      // Admin
      // -------------------------
      {
        path: 'admin/users',
        component: Users,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },

      // -------------------------
      // System
      // -------------------------
      { path: 'forbidden', component: Forbidden },

      // 404 dentro del Shell
      { path: '**', component: NotFound },
    ],
  },

  // Fallback final (por si algo queda fuera)
  { path: '**', redirectTo: '' },
];
