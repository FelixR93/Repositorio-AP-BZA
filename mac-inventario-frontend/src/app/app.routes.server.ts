// src/app/app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ✅ Está bien prerenderizar rutas estáticas
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'forbidden', renderMode: RenderMode.Prerender },
  { path: 'inventory', renderMode: RenderMode.Prerender },
  { path: 'inventory/global', renderMode: RenderMode.Prerender },

  // ✅ RUTAS CON PARAMS: NO prerender (para evitar getPrerenderParams)
  { path: 'inventory/:ap', renderMode: RenderMode.Server },
  { path: 'inventory/:ap/new', renderMode: RenderMode.Server },
  { path: 'inventory/:ap/import', renderMode: RenderMode.Server },
  { path: 'inventory/:ap/:id/edit', renderMode: RenderMode.Server },

  // ✅ Admin (también puede ser Server)
  { path: 'admin/users', renderMode: RenderMode.Server },

  // Wildcard
  { path: '**', renderMode: RenderMode.Server },
];
